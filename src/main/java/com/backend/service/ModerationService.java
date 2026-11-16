package com.backend.service;

import com.backend.cross.ModerationAction;
import com.backend.cross.NotificationType;
import com.backend.cross.ReportReason;
import com.backend.cross.ReportStatus;
import com.backend.cross.ReportTargetType;
import com.backend.cross.ResourceStatus;
import com.backend.cross.SanctionType;
import com.backend.domain.governance.Decision;
import com.backend.domain.governance.Report;
import com.backend.domain.governance.UserSanction;
import com.backend.domain.identity.User;
import com.backend.domain.repos.Resource;
import com.backend.domain.repos.StudyRepository;
import com.backend.dto.CreateReportRequest;
import com.backend.dto.DocumentDto;
import com.backend.dto.ReportResponseDto;
import com.backend.dto.RepositoryResponseDto;
import com.backend.dto.ResolveReportRequest;
import com.backend.exception.AuthException;
import com.backend.repository.DecisionRepository;
import com.backend.repository.ReportRepository;
import com.backend.repository.RepositoryCollaboratorRepository;
import com.backend.repository.RepositoryFollowRepository;
import com.backend.repository.RepositoryLikeRepository;
import com.backend.repository.ResourceRepository;
import com.backend.repository.StudyRepositoryRepository;
import com.backend.repository.UserRepository;
import com.backend.repository.UserSanctionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Gestiona creación de reportes por estudiantes y su revisión/resolución administrativa.
 */
@Service
public class ModerationService {

    private static final Set<ReportStatus> PENDING_STATUSES = EnumSet.of(ReportStatus.OPEN, ReportStatus.UNDER_REVIEW);

    private final ReportRepository reportRepository;
    private final DecisionRepository decisionRepository;
    private final UserSanctionRepository userSanctionRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final StudyRepositoryRepository studyRepositoryRepository;
    private final RepositoryCollaboratorRepository repositoryCollaboratorRepository;
    private final RepositoryLikeRepository repositoryLikeRepository;
    private final RepositoryFollowRepository repositoryFollowRepository;
    private final StudyRepositoryService studyRepositoryService;
    private final NotificationService notificationService;

    public ModerationService(
            ReportRepository reportRepository,
            DecisionRepository decisionRepository,
            UserSanctionRepository userSanctionRepository,
            UserRepository userRepository,
            ResourceRepository resourceRepository,
            StudyRepositoryRepository studyRepositoryRepository,
            RepositoryCollaboratorRepository repositoryCollaboratorRepository,
            RepositoryLikeRepository repositoryLikeRepository,
            RepositoryFollowRepository repositoryFollowRepository,
            StudyRepositoryService studyRepositoryService,
            NotificationService notificationService
    ) {
        this.reportRepository = reportRepository;
        this.decisionRepository = decisionRepository;
        this.userSanctionRepository = userSanctionRepository;
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
        this.studyRepositoryRepository = studyRepositoryRepository;
        this.repositoryCollaboratorRepository = repositoryCollaboratorRepository;
        this.repositoryLikeRepository = repositoryLikeRepository;
        this.repositoryFollowRepository = repositoryFollowRepository;
        this.studyRepositoryService = studyRepositoryService;
        this.notificationService = notificationService;
    }

    @Transactional
    public ReportResponseDto createReport(CreateReportRequest request, User currentUser) {
        User reporter = requireAuthenticated(currentUser, "Debes iniciar sesión para enviar un reporte.");

        ReportTargetType targetType = parseTargetType(request.getTargetType());
        String rawTargetId = request.getTargetId() == null ? "" : request.getTargetId().trim();
        if (rawTargetId.isEmpty()) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "No se pudo identificar el contenido que quieres reportar."
            );
        }

        ReportReason reason = parseReason(request.getReason());
        String comment = request.getComment() == null ? "" : request.getComment().trim();
        if (comment.length() > 1000) {
            comment = comment.substring(0, 1000);
        }

        Resource targetDoc = null;
        StudyRepository targetRepo = null;
        User targetUser = null;
        String targetLabel;

        switch (targetType) {
            case DOCUMENT -> {
                Long docId = parseId(rawTargetId, "Documento no encontrado.");
                targetDoc = resourceRepository.findByIdWithDetails(docId)
                        .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "DOCUMENT_NOT_FOUND", "Documento no encontrado."));
                if (reportRepository.existsByReporterIdAndTargetTypeAndStatusInAndResourceId(
                        reporter.getId(), ReportTargetType.DOCUMENT, PENDING_STATUSES, docId)) {
                    throw duplicateReportException();
                }
                targetUser = targetDoc.getUploadedBy();
                targetLabel = targetDoc.getTitle();
            }
            case REPOSITORY -> {
                Long repoId = parseId(rawTargetId, "Repositorio no encontrado.");
                targetRepo = studyRepositoryRepository.findByIdWithDetails(repoId)
                        .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "REPOSITORY_NOT_FOUND", "Repositorio no encontrado."));
                if (reportRepository.existsByReporterIdAndTargetTypeAndStatusInAndStudyRepositoryId(
                        reporter.getId(), ReportTargetType.REPOSITORY, PENDING_STATUSES, repoId)) {
                    throw duplicateReportException();
                }
                targetUser = targetRepo.getAuthor();
                targetLabel = targetRepo.getName();
            }
            case PROFILE -> {
                String cleanUsername = rawTargetId.replaceFirst("^@", "").toLowerCase(Locale.ROOT);
                targetUser = userRepository.findByUsernameIgnoreCase(cleanUsername)
                        .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Usuario no encontrado."));
                if (reportRepository.existsByReporterIdAndTargetTypeAndStatusInAndTargetUserId(
                        reporter.getId(), ReportTargetType.PROFILE, PENDING_STATUSES, targetUser.getId())) {
                    throw duplicateReportException();
                }
                targetLabel = "@" + targetUser.getUsername();
            }
            default -> throw new AuthException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Tipo de reporte inválido.");
        }

        Report report = new Report(
                reason,
                comment.isEmpty() ? null : comment,
                reporter,
                targetType,
                targetLabel,
                targetDoc,
                targetRepo,
                targetUser
        );
        Report saved = reportRepository.save(report);

        notifyAdminsOfNewReport(saved);
        return ReportResponseDto.fromEntity(saved, null, null, targetUser);
    }

    @Transactional(readOnly = true)
    public List<ReportResponseDto> getReports(String statusFilter, String reasonFilter, User currentUser) {
        requireAdmin(currentUser, "Solo los administradores pueden consultar la bandeja de reportes.");

        List<Report> allReports = reportRepository.findAllWithDetails();
        Map<Long, Decision> decisionMap = loadDecisions(allReports);

        String normalizedStatus = statusFilter == null ? "" : statusFilter.trim().toLowerCase(Locale.ROOT);
        ReportReason parsedReasonFilter = (reasonFilter != null && !reasonFilter.isBlank() && !"todos".equalsIgnoreCase(reasonFilter.trim()))
                ? parseReasonOrNull(reasonFilter)
                : null;

        return allReports.stream()
                .filter(report -> {
                    String mappedStatus = ReportResponseDto.toFrontendStatus(report.getStatus());
                    if (!normalizedStatus.isEmpty() && !normalizedStatus.equals(mappedStatus)) {
                        return false;
                    }
                    if (reasonFilter != null && !reasonFilter.isBlank() && !"todos".equalsIgnoreCase(reasonFilter.trim())) {
                        return parsedReasonFilter != null && report.getReason() == parsedReasonFilter;
                    }
                    return true;
                })
                .map(report -> ReportResponseDto.fromEntity(
                        report,
                        decisionMap.get(report.getId()),
                        null,
                        resolveAuthor(report)
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public ReportResponseDto getReportById(Long id, User currentUser, String baseUrl) {
        requireAdmin(currentUser, "Solo los administradores pueden consultar el detalle de un reporte.");

        Report report = reportRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "REPORT_NOT_FOUND", "Reporte no encontrado."));
        Decision decision = decisionRepository.findByReportId(id).orElse(null);

        User author = resolveAuthor(report);
        Object targetData = buildTargetData(report, currentUser, baseUrl);
        return ReportResponseDto.fromEntity(report, decision, targetData, author);
    }

    @Transactional
    public ReportResponseDto resolveReport(
            Long reportId,
            ResolveReportRequest request,
            User currentUser,
            String baseUrl
    ) {
        User admin = requireAdmin(currentUser, "Solo los administradores pueden resolver reportes.");

        ModerationAction action = parseAction(request.getAction());
        String note = request.getNote() == null ? "" : request.getNote().trim();
        if (note.length() > 1000) {
            note = note.substring(0, 1000);
        }

        Report report = reportRepository.findByIdWithDetails(reportId)
                .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "REPORT_NOT_FOUND", "Reporte no encontrado."));

        if (report.getStatus() == ReportStatus.RESOLVED || report.getStatus() == ReportStatus.DISMISSED) {
            throw new AuthException(HttpStatus.CONFLICT, "REPORT_ALREADY_RESOLVED", "Este reporte ya fue resuelto.");
        }

        report.setModerator(admin);
        report.setStatus(action == ModerationAction.KEEP ? ReportStatus.DISMISSED : ReportStatus.RESOLVED);

        User author = resolveAuthor(report);
        applyModerationAction(action, report, author, admin, note);

        Report savedReport = reportRepository.save(report);
        Decision decision = decisionRepository.save(new Decision(
                action,
                note.isEmpty() ? null : note,
                savedReport,
                admin
        ));

        Object targetData = buildTargetData(savedReport, admin, baseUrl);
        return ReportResponseDto.fromEntity(savedReport, decision, targetData, author);
    }

    private void applyModerationAction(
            ModerationAction action,
            Report report,
            User author,
            User admin,
            String note
    ) {
        String reasonLabel = ReportResponseDto.toFrontendReason(report.getReason());
        String detailMessage = note.isEmpty()
                ? "Se aplicó una medida de moderación sobre tu contenido reportado."
                : note;

        switch (action) {
            case KEEP -> {
                // Reporte descartado sin medidas sobre el contenido ni el autor.
            }
            case HIDE -> {
                if (report.getResource() != null) {
                    Resource resource = report.getResource();
                    resource.setStatus(ResourceStatus.HIDDEN);
                    resourceRepository.save(resource);
                }
                if (author != null) {
                    notificationService.create(
                            author,
                            NotificationType.CONTENT_HIDDEN,
                            "Contenido ocultado por moderación",
                            detailMessage,
                            "/terms"
                    );
                }
            }
            case REMOVE -> {
                if (report.getResource() != null) {
                    Resource resource = report.getResource();
                    resource.setStatus(ResourceStatus.REMOVED);
                    resourceRepository.save(resource);
                } else if (report.getStudyRepository() != null) {
                    Long repoId = report.getStudyRepository().getId();
                    StudyRepository repo = report.getStudyRepository();
                    reportRepository.clearRepositoryReference(repoId);
                    repositoryCollaboratorRepository.deleteByStudyRepositoryId(repoId);
                    repositoryLikeRepository.deleteByIdRepositoryId(repoId);
                    repositoryFollowRepository.deleteByIdRepositoryId(repoId);
                    studyRepositoryRepository.delete(repo);
                    report.setStudyRepository(null);
                }
                if (author != null) {
                    notificationService.create(
                            author,
                            NotificationType.CONTENT_DELETED,
                            "Contenido eliminado por moderación",
                            detailMessage,
                            "/terms"
                    );
                }
            }
            case WARN_USER -> {
                if (author != null) {
                    userSanctionRepository.save(new UserSanction(
                            author,
                            admin,
                            report,
                            SanctionType.ADVERTENCIA,
                            "Reporte #" + report.getId() + ": " + reasonLabel,
                            note.isEmpty() ? null : note
                    ));
                    notificationService.create(
                            author,
                            NotificationType.WARNING,
                            "Advertencia de moderación",
                            detailMessage,
                            "/terms"
                    );
                }
            }
            case SUSPEND_USER -> {
                if (author != null) {
                    author.setSuspended(true);
                    userRepository.save(author);
                    userSanctionRepository.save(new UserSanction(
                            author,
                            admin,
                            report,
                            SanctionType.SUSPENSION,
                            "Reporte #" + report.getId() + ": " + reasonLabel,
                            note.isEmpty() ? null : note
                    ));
                    notificationService.create(
                            author,
                            NotificationType.SANCTION,
                            "Cuenta suspendida",
                            detailMessage,
                            "/terms"
                    );
                }
            }
        }
    }

    private Object buildTargetData(Report report, User viewer, String baseUrl) {
        if (report.getTargetType() == ReportTargetType.DOCUMENT && report.getResource() != null) {
            Resource res = report.getResource();
            String previewUrl = baseUrl + "/api/documents/" + res.getId() + "/preview";
            return DocumentDto.fromEntity(res, previewUrl);
        }
        if (report.getTargetType() == ReportTargetType.REPOSITORY && report.getStudyRepository() != null) {
            List<RepositoryResponseDto> mapped = studyRepositoryService.mapRepositories(
                    List.of(report.getStudyRepository()),
                    viewer
            );
            return mapped.isEmpty() ? null : mapped.get(0);
        }
        if (report.getTargetType() == ReportTargetType.PROFILE && report.getTargetUser() != null) {
            User target = report.getTargetUser();
            return Map.of(
                    "id", target.getId(),
                    "username", target.getUsername(),
                    "name", target.getName(),
                    "email", target.getInstitutionalEmail(),
                    "suspended", target.isSuspended()
            );
        }
        return null;
    }

    private User resolveAuthor(Report report) {
        if (report.getTargetUser() != null) {
            return report.getTargetUser();
        }
        if (report.getResource() != null && report.getResource().getUploadedBy() != null) {
            return report.getResource().getUploadedBy();
        }
        if (report.getStudyRepository() != null && report.getStudyRepository().getAuthor() != null) {
            return report.getStudyRepository().getAuthor();
        }
        return null;
    }

    private Map<Long, Decision> loadDecisions(List<Report> reports) {
        Map<Long, Decision> map = new LinkedHashMap<>();
        if (reports.isEmpty()) {
            return map;
        }
        List<Long> ids = reports.stream().map(Report::getId).toList();
        for (Decision decision : decisionRepository.findByReportIdInWithModerator(ids)) {
            if (decision.getReport() != null) {
                map.put(decision.getReport().getId(), decision);
            }
        }
        return map;
    }

    private void notifyAdminsOfNewReport(Report saved) {
        for (User candidate : userRepository.findVerifiedUsers()) {
            if (isAdminUser(candidate)) {
                notificationService.create(
                        candidate,
                        NotificationType.REPORT_PENDING,
                        "Nuevo reporte pendiente",
                        "@" + saved.getReporter().getUsername() + " reportó \"" + saved.getTargetLabel() + "\".",
                        "/admin/reports/" + saved.getId()
                );
            }
        }
    }

    private ReportTargetType parseTargetType(String rawType) {
        if (rawType == null) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "No se pudo identificar el contenido que quieres reportar.");
        }
        return switch (rawType.trim().toLowerCase(Locale.ROOT)) {
            case "document" -> ReportTargetType.DOCUMENT;
            case "repository" -> ReportTargetType.REPOSITORY;
            case "profile" -> ReportTargetType.PROFILE;
            default -> throw new AuthException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Tipo de reporte inválido.");
        };
    }

    private ReportReason parseReason(String rawReason) {
        ReportReason parsed = parseReasonOrNull(rawReason);
        if (parsed == null) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Selecciona el motivo del reporte.",
                    Map.of("reason", "Selecciona el motivo del reporte.")
            );
        }
        return parsed;
    }

    private ReportReason parseReasonOrNull(String rawReason) {
        if (rawReason == null || rawReason.isBlank()) return null;
        return switch (rawReason.trim().toLowerCase(Locale.ROOT)) {
            case "mal-etiquetado", "mislabeled" -> ReportReason.MISLABELED;
            case "duplicado", "duplicate" -> ReportReason.DUPLICATE;
            case "inapropiado", "inappropriate_content" -> ReportReason.INAPPROPRIATE_CONTENT;
            case "examen-vigente", "active_exam" -> ReportReason.ACTIVE_EXAM;
            case "plagio", "plagiarism" -> ReportReason.PLAGIARISM;
            case "archivo-corrupto", "corrupted_file" -> ReportReason.CORRUPTED_FILE;
            case "otro", "other" -> ReportReason.OTHER;
            default -> null;
        };
    }

    private ModerationAction parseAction(String rawAction) {
        if (rawAction == null || rawAction.isBlank()) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Acción de resolución inválida.");
        }
        return switch (rawAction.trim().toLowerCase(Locale.ROOT)) {
            case "descartado", "keep" -> ModerationAction.KEEP;
            case "ocultado", "hide" -> ModerationAction.HIDE;
            case "eliminado", "remove" -> ModerationAction.REMOVE;
            case "advertencia", "warn_user" -> ModerationAction.WARN_USER;
            case "suspension", "suspend_user" -> ModerationAction.SUSPEND_USER;
            default -> throw new AuthException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Acción de resolución inválida.");
        };
    }

    private Long parseId(String rawId, String notFoundMessage) {
        try {
            return Long.parseLong(rawId);
        } catch (NumberFormatException ex) {
            throw new AuthException(HttpStatus.NOT_FOUND, "TARGET_NOT_FOUND", notFoundMessage);
        }
    }

    private AuthException duplicateReportException() {
        return new AuthException(
                HttpStatus.CONFLICT,
                "DUPLICATE_REPORT",
                "Ya reportaste este contenido. El equipo de administración lo revisará."
        );
    }

    private User requireAuthenticated(User user, String message) {
        if (user == null) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", message);
        }
        return user;
    }

    private User requireAdmin(User user, String forbiddenMessage) {
        User current = requireAuthenticated(user, "Debes iniciar sesión para realizar esta acción.");
        if (!isAdminUser(current)) {
            throw new AuthException(HttpStatus.FORBIDDEN, "FORBIDDEN", forbiddenMessage);
        }
        return current;
    }

    private boolean isAdminUser(User user) {
        return user.getRole() != null
                && user.getRole().getName() != null
                && user.getRole().getName().toLowerCase(Locale.ROOT).contains("admin");
    }
}
