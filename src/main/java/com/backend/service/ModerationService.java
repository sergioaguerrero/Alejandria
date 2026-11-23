package com.backend.service;

import com.backend.cross.ModerationAction;
import com.backend.cross.NotificationType;
import com.backend.cross.ReportReason;
import com.backend.cross.ReportStatus;
import com.backend.cross.ReportTargetType;
import com.backend.domain.governance.Decision;
import com.backend.domain.governance.Report;
import com.backend.domain.identity.User;
import com.backend.domain.repos.Resource;
import com.backend.domain.repos.StudyRepository;
import com.backend.domain.repos.Tag;
import com.backend.dto.CreateReportRequest;
import com.backend.dto.DocumentDto;
import com.backend.dto.ReportResponseDto;
import com.backend.dto.RepositoryResponseDto;
import com.backend.dto.ResolveReportRequest;
import com.backend.exception.AuthException;
import com.backend.repository.DecisionRepository;
import com.backend.repository.ReportRepository;
import com.backend.repository.ResourceRepository;
import com.backend.repository.StudyRepositoryRepository;
import com.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Gestiona creación de reportes por estudiantes y su revisión/resolución administrativa
 * delegando validaciones y resolución transaccional a PKG_MODERACION.
 */
@Service
public class ModerationService {

    private final ReportRepository reportRepository;
    private final DecisionRepository decisionRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final StudyRepositoryRepository studyRepositoryRepository;
    private final StudyRepositoryService studyRepositoryService;
    private final NotificationService notificationService;
    private final OraclePackageService oraclePackageService;
    private final com.backend.repository.ModeracionRepository moderacionRepository;
    private final com.backend.repository.AuthUsuariosRepository authUsuariosRepository;

    public ModerationService(
            ReportRepository reportRepository,
            DecisionRepository decisionRepository,
            UserRepository userRepository,
            ResourceRepository resourceRepository,
            StudyRepositoryRepository studyRepositoryRepository,
            StudyRepositoryService studyRepositoryService,
            NotificationService notificationService,
            OraclePackageService oraclePackageService,
            com.backend.repository.ModeracionRepository moderacionRepository,
            com.backend.repository.AuthUsuariosRepository authUsuariosRepository
    ) {
        this.reportRepository = reportRepository;
        this.decisionRepository = decisionRepository;
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
        this.studyRepositoryRepository = studyRepositoryRepository;
        this.studyRepositoryService = studyRepositoryService;
        this.notificationService = notificationService;
        this.oraclePackageService = oraclePackageService;
        this.moderacionRepository = moderacionRepository;
        this.authUsuariosRepository = authUsuariosRepository;
    }

    @Transactional
    public ReportResponseDto createReport(CreateReportRequest request, User currentUser) {
        User reporter = AuthGuards.requireAuthenticated(currentUser, "Debes iniciar sesión para enviar un reporte.");

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
                Resource docMeta = resourceRepository.findAllMetadataByIdIn(List.of(docId)).stream()
                        .findFirst()
                        .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "DOCUMENT_NOT_FOUND", "Documento no encontrado."));
                if (moderacionRepository.existeReporteActivo(reporter.getId(), ReportTargetType.DOCUMENT.name(), docId) == 1) {
                    throw duplicateReportException();
                }
                targetDoc = resourceRepository.getReferenceById(docId);
                targetUser = docMeta.getUploadedBy();
                targetLabel = docMeta.getTitle();
            }
            case REPOSITORY -> {
                Long repoId = parseId(rawTargetId, "Repositorio no encontrado.");
                targetRepo = studyRepositoryRepository.findById(repoId)
                        .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "REPOSITORY_NOT_FOUND", "Repositorio no encontrado."));
                if (moderacionRepository.existeReporteActivo(reporter.getId(), ReportTargetType.REPOSITORY.name(), repoId) == 1) {
                    throw duplicateReportException();
                }
                targetUser = targetRepo.getAuthor();
                targetLabel = targetRepo.getName();
            }
            case PROFILE -> {
                String cleanUsername = rawTargetId.replaceFirst("^@", "").toLowerCase(Locale.ROOT);
                Long targetUserId = authUsuariosRepository.buscarUsuarioPorUsername(cleanUsername);
                targetUser = (targetUserId == null ? Optional.<User>empty() : userRepository.findById(targetUserId))
                        .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Usuario no encontrado."));
                if (moderacionRepository.existeReporteActivo(reporter.getId(), ReportTargetType.PROFILE.name(), targetUser.getId()) == 1) {
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
        AuthGuards.requireAdmin(currentUser, "Solo los administradores pueden consultar la bandeja de reportes.");

        List<Long> reportIds = oraclePackageService.fnListarReportesIds();
        List<Report> allReports = oraclePackageService.orderByIds(
                reportIds,
                reportRepository.findAllById(reportIds),
                Report::getId
        );
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
        AuthGuards.requireAdmin(currentUser, "Solo los administradores pueden consultar el detalle de un reporte.");

        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "REPORT_NOT_FOUND", "Reporte no encontrado."));
        Decision decision = findDecisionForReport(id);

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
        User admin = AuthGuards.requireAdmin(currentUser, "Solo los administradores pueden resolver reportes.");

        ModerationAction action = parseAction(request.getAction());
        String note = request.getNote() == null ? "" : request.getNote().trim();
        if (note.length() > 1000) {
            note = note.substring(0, 1000);
        }

        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "REPORT_NOT_FOUND", "Reporte no encontrado."));

        if (report.getStatus() == ReportStatus.RESOLVED || report.getStatus() == ReportStatus.DISMISSED) {
            throw new AuthException(HttpStatus.CONFLICT, "REPORT_ALREADY_RESOLVED", "Este reporte ya fue resuelto.");
        }

        User author = resolveAuthor(report);

        // Ejecuta toda la resolución en BD (DECISION, REPORTE, RECURSO_ACADEMICO / REPOSITORIO_ESTUDIO, SANCION_USUARIO, USUARIO)
        oraclePackageService.prResolverReporte(
                reportId,
                admin.getId(),
                action.name(),
                note.isEmpty() ? null : note
        );

        notifyAuthorAfterModeration(action, author, note);

        Report updatedReport = reportRepository.findById(reportId).orElse(report);
        Decision decision = findDecisionForReport(reportId);
        User updatedAuthor = resolveAuthor(updatedReport);
        if (updatedAuthor == null && author != null) {
            updatedAuthor = userRepository.findById(author.getId()).orElse(author);
        }

        Object targetData = buildTargetData(updatedReport, admin, baseUrl);
        return ReportResponseDto.fromEntity(updatedReport, decision, targetData, updatedAuthor);
    }

    private void notifyAuthorAfterModeration(ModerationAction action, User author, String note) {
        if (author == null) {
            return;
        }
        String detailMessage = note.isEmpty()
                ? "Se aplicó una medida de moderación sobre tu contenido reportado."
                : note;

        switch (action) {
            case KEEP -> { }
            case HIDE -> notificationService.create(
                    author,
                    NotificationType.CONTENT_HIDDEN,
                    "Contenido ocultado por moderación",
                    detailMessage,
                    "/terms"
            );
            case REMOVE -> notificationService.create(
                    author,
                    NotificationType.CONTENT_DELETED,
                    "Contenido eliminado por moderación",
                    detailMessage,
                    "/terms"
            );
            case WARN_USER -> notificationService.create(
                    author,
                    NotificationType.WARNING,
                    "Advertencia de moderación",
                    detailMessage,
                    "/terms"
            );
            case SUSPEND_USER -> notificationService.create(
                    author,
                    NotificationType.SANCTION,
                    "Cuenta suspendida",
                    detailMessage,
                    "/terms"
            );
        }
    }

    private Decision findDecisionForReport(Long reportId) {
        Long decisionId = moderacionRepository.obtenerDecisionReporte(reportId);
        return decisionId == null ? null : decisionRepository.findById(decisionId).orElse(null);
    }

    private Object buildTargetData(Report report, User viewer, String baseUrl) {
        if (report.getTargetType() == ReportTargetType.DOCUMENT && report.getResource() != null) {
            Long docId = report.getResource().getId();
            Resource res = resourceRepository.findAllMetadataByIdIn(List.of(docId)).stream()
                    .findFirst()
                    .orElse(null);
            if (res == null) {
                return null;
            }
            Set<Tag> tags = new LinkedHashSet<>();
            for (Object[] row : resourceRepository.findTagPairsByResourceIdIn(List.of(docId))) {
                if (row[1] instanceof Tag tag) {
                    tags.add(tag);
                }
            }
            res.setTags(tags);
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
        for (Report report : reports) {
            Decision decision = findDecisionForReport(report.getId());
            if (decision != null) {
                map.put(report.getId(), decision);
            }
        }
        return map;
    }

    private void notifyAdminsOfNewReport(Report saved) {
        List<Long> adminIds = oraclePackageService.fnAdminsVerificadosIds();
        for (User admin : userRepository.findAllById(adminIds)) {
            notificationService.create(
                    admin,
                    NotificationType.REPORT_PENDING,
                    "Nuevo reporte pendiente",
                    "@" + saved.getReporter().getUsername() + " reportó \"" + saved.getTargetLabel() + "\".",
                    "/admin/reports/" + saved.getId()
            );
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
}
