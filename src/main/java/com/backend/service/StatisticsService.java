package com.backend.service;

import com.backend.cross.AiContentType;
import com.backend.cross.InteractionType;
import com.backend.cross.ResourceType;
import com.backend.domain.identity.User;
import com.backend.domain.repos.StudyRepository;
import com.backend.dto.DocumentDto;
import com.backend.repository.AiMaterialRepository;
import com.backend.repository.AiShareRepository;
import com.backend.repository.InteractionRepository;
import com.backend.repository.StudyRepositoryRepository;
import com.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Calcula estadísticas personales del estudiante y analíticas globales/avanzadas del administrador
 * invocando las funciones de PKG_ANALITICAS, PKG_REPOSITORIOS, PKG_AUTH_USUARIOS, PKG_IA_ESTUDIO y PKG_MODERACION.
 */
@Service
public class StatisticsService {

    private static final List<String> WEEK_LABELS = List.of("Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom");
    private static final List<String> MONTH_LABELS = List.of("Sem 1", "Sem 2", "Sem 3", "Sem 4");
    private static final List<String> DAY_HOUR_LABELS = List.of("00:00", "04:00", "08:00", "12:00", "16:00", "20:00");

    private final StudyRepositoryRepository studyRepositoryRepository;
    private final UserRepository userRepository;
    private final InteractionRepository interactionRepository;
    private final AiMaterialRepository aiMaterialRepository;
    private final AiShareRepository aiShareRepository;
    private final OraclePackageService oraclePackageService;

    public StatisticsService(
            StudyRepositoryRepository studyRepositoryRepository,
            UserRepository userRepository,
            InteractionRepository interactionRepository,
            AiMaterialRepository aiMaterialRepository,
            AiShareRepository aiShareRepository,
            OraclePackageService oraclePackageService
    ) {
        this.studyRepositoryRepository = studyRepositoryRepository;
        this.userRepository = userRepository;
        this.interactionRepository = interactionRepository;
        this.aiMaterialRepository = aiMaterialRepository;
        this.aiShareRepository = aiShareRepository;
        this.oraclePackageService = oraclePackageService;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMyStatistics(String rawPeriod, User currentUser) {
        User user = AuthGuards.requireAuthenticated(currentUser, "Debes iniciar sesión para consultar tus estadísticas.");
        String period = "month".equalsIgnoreCase(rawPeriod) ? "month" : "week";

        List<Object[]> myResourceRows = oraclePackageService.fnEstadisticasRecursosAutor(user.getId());
        List<Long> userRepoIds = oraclePackageService.fnRepositoriosPorAutorIds(user.getUsername());
        List<StudyRepository> userRepos = studyRepositoryRepository.findAllById(userRepoIds);

        long totalViews = 0;
        long totalDownloads = 0;
        List<Map<String, Object>> myDocuments = new ArrayList<>();
        Map<String, Integer> uploadedSubjectCounts = new LinkedHashMap<>();

        for (Object[] row : myResourceRows) {
            int views = ((Number) row[4]).intValue();
            int downloads = ((Number) row[5]).intValue();
            totalViews += views;
            totalDownloads += downloads;

            String subjectName = (String) row[8];
            uploadedSubjectCounts.merge(subjectName, Math.max(1, views + downloads), Integer::sum);

            Map<String, Object> docMap = new LinkedHashMap<>();
            docMap.put("id", String.valueOf(row[0]));
            docMap.put("title", row[1]);
            docMap.put("type", DocumentDto.toFrontendType((ResourceType) row[2]));
            docMap.put("views", views);
            docMap.put("downloads", downloads);
            docMap.put("createdAt", row[6]);
            myDocuments.add(docMap);
        }
        myDocuments.sort((a, b) -> {
            LocalDateTime da = (LocalDateTime) a.get("createdAt");
            LocalDateTime db = (LocalDateTime) b.get("createdAt");
            if (da == null && db == null) return 0;
            if (da == null) return 1;
            if (db == null) return -1;
            return db.compareTo(da);
        });

        long totalLikes = userRepos.stream().mapToLong(StudyRepository::getLikes).sum();

        LocalDate today = LocalDate.now();
        LocalDateTime since = "week".equals(period)
                ? today.minusDays(6).atStartOfDay()
                : today.minusDays(27).atStartOfDay();

        List<Object[]> activityRows = oraclePackageService.fnActividadRecursosAutor(user.getId(), since);
        List<Map<String, Object>> activity = buildPersonalActivityTimeline(period, today, activityRows);

        List<Map<String, Object>> topSubjects = oraclePackageService.fnConsultasUsuarioMateria(user.getId())
                .stream()
                .limit(5)
                .map(row -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("subject", row[0]);
                    item.put("consultados", ((Number) row[1]).intValue());
                    return item;
                })
                .toList();

        if (topSubjects.isEmpty() && !uploadedSubjectCounts.isEmpty()) {
            topSubjects = uploadedSubjectCounts.entrySet().stream()
                    .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                    .limit(5)
                    .map(e -> {
                        Map<String, Object> item = new LinkedHashMap<>();
                        item.put("subject", e.getKey());
                        item.put("consultados", e.getValue());
                        return item;
                    })
                    .toList();
        }

        List<Map<String, Object>> recentHistory = buildRecentHistory(user.getId());

        Map<String, Object> totals = new LinkedHashMap<>();
        totals.put("documentsUploaded", myDocuments.size());
        totals.put("views", totalViews);
        totals.put("downloads", totalDownloads);
        totals.put("likes", totalLikes);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totals", totals);
        response.put("activity", activity);
        response.put("topSubjects", topSubjects);
        response.put("recentHistory", recentHistory);
        response.put("myDocuments", myDocuments);
        return response;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getGlobalStatistics(User currentUser) {
        AuthGuards.requireAdmin(currentUser, "Solo los administradores pueden consultar las estadísticas globales.");

        long activeStudentsCount = userRepository.fnContarEstudiantesActivos();
        long totalRepositories = studyRepositoryRepository.fnContarTotalRepositorios();
        List<Object[]> resourceRows = oraclePackageService.fnEstadisticasRecursosPub();

        Map<String, Long> subjectViews = new LinkedHashMap<>();
        Map<String, Long> docsBySubject = new LinkedHashMap<>();
        Map<String, TopicBucket> topics = new LinkedHashMap<>();
        List<Map<String, Object>> docSummaries = new ArrayList<>();

        for (Object[] row : resourceRows) {
            String title = (String) row[1];
            String topic = (String) row[3];
            int views = ((Number) row[4]).intValue();
            int downloads = ((Number) row[5]).intValue();
            String subjectName = (String) row[8];

            subjectViews.merge(subjectName, (long) views, Long::sum);
            docsBySubject.merge(subjectName, 1L, Long::sum);

            if (topic != null && !topic.isBlank()) {
                String cleanTopic = topic.trim();
                String key = cleanTopic.toLowerCase(Locale.ROOT);
                topics.computeIfAbsent(key, k -> new TopicBucket(cleanTopic)).count++;
            }

            Map<String, Object> docSummary = new LinkedHashMap<>();
            docSummary.put("id", String.valueOf(row[0]));
            docSummary.put("title", title);
            docSummary.put("subjectName", subjectName);
            docSummary.put("views", views);
            docSummary.put("downloads", downloads);
            docSummaries.add(docSummary);
        }

        List<Map<String, Object>> topSubjects = subjectViews.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("subject", e.getKey());
                    m.put("vistas", e.getValue());
                    return m;
                })
                .toList();

        List<Map<String, Object>> topTopics = topics.values().stream()
                .sorted((a, b) -> Long.compare(b.count, a.count))
                .limit(5)
                .map(b -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("tema", b.label);
                    m.put("documentos", b.count);
                    return m;
                })
                .toList();

        Map<Integer, Long> dbSemesterCounts = oraclePackageService.fnEstudiantesPorSemestre();
        Map<Integer, Long> semesterCounts = new LinkedHashMap<>();
        for (int s = 1; s <= 10; s++) {
            semesterCounts.put(s, dbSemesterCounts.getOrDefault(s, 0L));
        }
        List<Map<String, Object>> studentsBySemester = semesterCounts.entrySet().stream()
                .filter(e -> e.getValue() > 0 || e.getKey() <= 6)
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("semestre", "Sem " + e.getKey());
                    m.put("estudiantes", e.getValue());
                    return m;
                })
                .toList();

        List<Map<String, Object>> documentsBySubject = docsBySubject.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("materia", e.getKey());
                    m.put("documentos", e.getValue());
                    return m;
                })
                .toList();

        docSummaries.sort(Comparator
                .comparingInt((Map<String, Object> d) -> (Integer) d.get("views")).reversed()
                .thenComparingInt(d -> -((Integer) d.get("downloads"))));
        List<Map<String, Object>> topDocuments = docSummaries.stream().limit(6).toList();

        ReportStats reportStats = computeReportStats();

        Map<String, Object> totals = new LinkedHashMap<>();
        totals.put("repositories", totalRepositories);
        totals.put("documents", resourceRows.size());
        totals.put("activeStudents", activeStudentsCount);
        totals.put("totalReports", reportStats.total);
        totals.put("pendingReports", reportStats.pending);
        totals.put("resolvedReports", reportStats.resolved);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totals", totals);
        response.put("topSubjects", topSubjects);
        response.put("topTopics", topTopics);
        response.put("studentsBySemester", studentsBySemester);
        response.put("documentsBySubject", documentsBySubject);
        response.put("topDocuments", topDocuments);
        response.put("reasonsSummary", reportStats.reasonsSummary);
        return response;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAdvancedAdminStatistics(String rawPeriod, User currentUser) {
        AuthGuards.requireAdmin(currentUser, "No tienes permisos de administrador.");
        String period = switch (rawPeriod == null ? "" : rawPeriod.trim().toLowerCase(Locale.ROOT)) {
            case "day" -> "day";
            case "month" -> "month";
            default -> "week";
        };

        long totalStudents = userRepository.fnContarEstudiantesActivos();

        LocalDate today = LocalDate.now();
        LocalDateTime since = switch (period) {
            case "day" -> today.atStartOfDay();
            case "month" -> today.minusDays(27).atStartOfDay();
            default -> today.minusDays(6).atStartOfDay();
        };

        List<Object[]> activityRows = oraclePackageService.fnActividadUsuariosDesde(since);
        long totalActive = interactionRepository.fnContarUsuariosActivos(since);
        int engagementRate = totalStudents > 0 ? (int) Math.round((totalActive * 100.0) / totalStudents) : 0;

        List<Map<String, Object>> activeTimeline = buildActiveUsersTimeline(period, today, activityRows);

        List<Object[]> rawTerms = oraclePackageService.fnTopTerminosBusqueda(since, 8);
        long maxSearch = rawTerms.isEmpty() ? 1L : Math.max(1L, ((Number) rawTerms.get(0)[1]).longValue());
        List<Map<String, Object>> topSearchTerms = rawTerms.stream()
                .map(row -> {
                    long count = ((Number) row[1]).longValue();
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("term", row[0]);
                    m.put("count", count);
                    m.put("sharePercent", (int) Math.round((count * 100.0) / maxSearch));
                    return m;
                })
                .toList();

        Map<String, Object> activeUsers = new LinkedHashMap<>();
        activeUsers.put("totalActive", totalActive);
        activeUsers.put("totalStudents", totalStudents);
        activeUsers.put("engagementRate", engagementRate);
        activeUsers.put("deltaLabel", activityRows.size() + " interacciones registradas");
        activeUsers.put("timeline", activeTimeline);

        Map<String, Object> aiUsage = buildAiUsage(period, today, since);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("period", period);
        response.put("activeUsers", activeUsers);
        response.put("topSearchTerms", topSearchTerms);
        response.put("aiUsage", aiUsage);
        return response;
    }

    private List<Map<String, Object>> buildPersonalActivityTimeline(
            String period,
            LocalDate today,
            List<Object[]> rows
    ) {
        if ("month".equals(period)) {
            int[] views = new int[4];
            int[] downloads = new int[4];
            for (Object[] row : rows) {
                InteractionType type = (InteractionType) row[0];
                LocalDateTime dt = (LocalDateTime) row[1];
                long daysAgo = ChronoUnit.DAYS.between(dt.toLocalDate(), today);
                if (daysAgo < 0 || daysAgo > 27) continue;
                int bucket = 3 - (int) (daysAgo / 7);
                if (type == InteractionType.VIEW) views[bucket]++;
                else if (type == InteractionType.DOWNLOAD) downloads[bucket]++;
            }
            List<Map<String, Object>> list = new ArrayList<>();
            for (int i = 0; i < 4; i++) {
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("name", MONTH_LABELS.get(i));
                entry.put("vistas", views[i]);
                entry.put("descargas", downloads[i]);
                list.add(entry);
            }
            return list;
        }

        int[] views = new int[7];
        int[] downloads = new int[7];
        for (Object[] row : rows) {
            InteractionType type = (InteractionType) row[0];
            LocalDateTime dt = (LocalDateTime) row[1];
            int idx = dt.getDayOfWeek().getValue() - DayOfWeek.MONDAY.getValue();
            if (idx < 0 || idx > 6) continue;
            if (type == InteractionType.VIEW) views[idx]++;
            else if (type == InteractionType.DOWNLOAD) downloads[idx]++;
        }
        List<Map<String, Object>> list = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("name", WEEK_LABELS.get(i));
            entry.put("vistas", views[i]);
            entry.put("descargas", downloads[i]);
            list.add(entry);
        }
        return list;
    }

    private List<Map<String, Object>> buildRecentHistory(Long userId) {
        List<Object[]> rows = oraclePackageService.fnHistorialUsuario(userId, 30);
        List<Map<String, Object>> history = new ArrayList<>();
        Set<Long> seenDocs = new HashSet<>();

        for (Object[] row : rows) {
            Long resId = ((Number) row[0]).longValue();
            if (!seenDocs.add(resId)) {
                continue;
            }
            String title = (String) row[1];
            String repoName = row[2] != null ? (String) row[2] : "Repositorio";
            LocalDateTime date = (LocalDateTime) row[3];
            ResourceType type = (ResourceType) row[4];

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", String.valueOf(resId));
            entry.put("title", title);
            entry.put("repositoryName", repoName);
            entry.put("date", date);
            entry.put("type", DocumentDto.toFrontendType(type));
            history.add(entry);
            if (history.size() >= 5) {
                break;
            }
        }
        return history;
    }

    private List<Map<String, Object>> buildActiveUsersTimeline(
            String period,
            LocalDate today,
            List<Object[]> rows
    ) {
        List<String> labels = switch (period) {
            case "day" -> DAY_HOUR_LABELS;
            case "month" -> MONTH_LABELS;
            default -> WEEK_LABELS;
        };

        List<Set<Long>> activeSets = new ArrayList<>();
        int[] sessions = new int[labels.size()];
        for (int i = 0; i < labels.size(); i++) {
            activeSets.add(new HashSet<>());
        }

        for (Object[] row : rows) {
            Long uid = row[0] != null ? ((Number) row[0]).longValue() : null;
            LocalDateTime dt = (LocalDateTime) row[1];
            int bucket = resolveTimeBucket(period, today, dt);
            if (bucket < 0 || bucket >= labels.size()) continue;
            sessions[bucket]++;
            if (uid != null) {
                activeSets.get(bucket).add(uid);
            }
        }

        List<Map<String, Object>> timeline = new ArrayList<>();
        for (int i = 0; i < labels.size(); i++) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("label", labels.get(i));
            m.put("activos", activeSets.get(i).size());
            m.put("sesiones", sessions[i]);
            timeline.add(m);
        }
        return timeline;
    }

    private int resolveTimeBucket(String period, LocalDate today, LocalDateTime dt) {
        return switch (period) {
            case "day" -> Math.min(5, dt.getHour() / 4);
            case "month" -> {
                long daysAgo = ChronoUnit.DAYS.between(dt.toLocalDate(), today);
                yield daysAgo < 0 || daysAgo > 27 ? -1 : 3 - (int) (daysAgo / 7);
            }
            default -> dt.getDayOfWeek().getValue() - DayOfWeek.MONDAY.getValue();
        };
    }

    private Map<String, Object> buildAiUsage(String period, LocalDate today, LocalDateTime since) {
        List<Object[]> rows = oraclePackageService.fnEstadisticasIaDesde(since);
        long totalGenerations = aiMaterialRepository.fnContarTotalMaterialIa();
        long sharedWithFriends = aiShareRepository.fnContarTotalCompartidosIa();

        Map<AiContentType, Long> typeCounts = new LinkedHashMap<>();
        for (AiContentType type : AiContentType.values()) {
            typeCounts.put(type, 0L);
        }

        List<String> labels = switch (period) {
            case "day" -> DAY_HOUR_LABELS;
            case "month" -> MONTH_LABELS;
            default -> WEEK_LABELS;
        };
        int[] bucketCounts = new int[labels.size()];
        Map<String, Map<String, Object>> repoStats = new LinkedHashMap<>();

        for (Object[] row : rows) {
            AiContentType type = (AiContentType) row[1];
            Long repoId = row[2] != null ? ((Number) row[2]).longValue() : null;
            String repoName = String.valueOf(row[3]);
            String subjectName = String.valueOf(row[4]);
            LocalDateTime createdAt = (LocalDateTime) row[5];

            typeCounts.merge(type, 1L, Long::sum);

            int bucket = resolveTimeBucket(period, today, createdAt);
            if (bucket >= 0 && bucket < bucketCounts.length) {
                bucketCounts[bucket]++;
            }

            String repoKey = repoId != null ? String.valueOf(repoId) : "deleted-" + repoName;
            Map<String, Object> entry = repoStats.computeIfAbsent(repoKey, k -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("repositoryId", repoKey);
                m.put("repositoryName", repoName);
                m.put("subjectName", subjectName);
                m.put("count", 0L);
                return m;
            });
            entry.put("count", ((Number) entry.get("count")).longValue() + 1L);
        }

        List<Map<String, Object>> byType = List.of(
                aiTypeRow("quiz", "Cuestionario", typeCounts.getOrDefault(AiContentType.QUIZ, 0L)),
                aiTypeRow("summary", "Resumen", typeCounts.getOrDefault(AiContentType.SUMMARY, 0L)),
                aiTypeRow("guide", "Guía", typeCounts.getOrDefault(AiContentType.GUIDE, 0L)),
                aiTypeRow("slides", "Diapositivas", typeCounts.getOrDefault(AiContentType.SLIDES, 0L))
        );

        List<Map<String, Object>> timeline = new ArrayList<>();
        for (int i = 0; i < labels.size(); i++) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("label", labels.get(i));
            item.put("generaciones", bucketCounts[i]);
            timeline.add(item);
        }

        List<Map<String, Object>> topRepositories = repoStats.values().stream()
                .sorted((a, b) -> Long.compare(
                        ((Number) b.get("count")).longValue(),
                        ((Number) a.get("count")).longValue()
                ))
                .limit(5)
                .toList();

        Map<String, Object> aiUsage = new LinkedHashMap<>();
        aiUsage.put("periodGenerations", rows.size());
        aiUsage.put("totalGenerations", totalGenerations);
        aiUsage.put("sharedWithFriends", sharedWithFriends);
        aiUsage.put("byType", byType);
        aiUsage.put("topRepositories", topRepositories);
        aiUsage.put("timeline", timeline);
        return aiUsage;
    }

    private Map<String, Object> aiTypeRow(String type, String label, long count) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("contentType", type);
        row.put("label", label);
        row.put("count", count);
        return row;
    }

    private ReportStats computeReportStats() {
        Map<String, Long> pendingByLabel = new LinkedHashMap<>();
        Map<String, Long> resolvedByLabel = new LinkedHashMap<>();
        List<String> defaultLabels = List.of(
                "Mal etiquetado",
                "Contenido duplicado",
                "Contenido inapropiado",
                "Examen vigente",
                "Plagio"
        );
        for (String label : defaultLabels) {
            pendingByLabel.put(label, 0L);
            resolvedByLabel.put(label, 0L);
        }

        long total = 0;
        long pending = 0;
        long resolved = 0;

        for (Object[] row : oraclePackageService.fnResumenReportes()) {
            String rawReason = String.valueOf(row[0]);
            String rawStatus = String.valueOf(row[1]);
            long count = ((Number) row[2]).longValue();

            total += count;
            boolean isResolved = "RESOLVED".equalsIgnoreCase(rawStatus) || "DISMISSED".equalsIgnoreCase(rawStatus);
            if (isResolved) {
                resolved += count;
            } else {
                pending += count;
            }

            String label = mapReasonLabel(rawReason);
            if (isResolved) {
                resolvedByLabel.merge(label, count, Long::sum);
            } else {
                pendingByLabel.merge(label, count, Long::sum);
            }
        }

        List<Map<String, Object>> summary = new ArrayList<>();
        for (String label : pendingByLabel.keySet()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("reason", label);
            m.put("pendientes", pendingByLabel.getOrDefault(label, 0L));
            m.put("resueltos", resolvedByLabel.getOrDefault(label, 0L));
            summary.add(m);
        }
        return new ReportStats(total, pending, resolved, summary);
    }

    private String mapReasonLabel(String rawReason) {
        if (rawReason == null) return "Otros";
        return switch (rawReason.trim().toUpperCase(Locale.ROOT)) {
            case "MISLABELED" -> "Mal etiquetado";
            case "DUPLICATE" -> "Contenido duplicado";
            case "INAPPROPRIATE_CONTENT" -> "Contenido inapropiado";
            case "ACTIVE_EXAM" -> "Examen vigente";
            case "PLAGIARISM" -> "Plagio";
            case "CORRUPTED_FILE" -> "Archivo corrupto";
            default -> "Otros";
        };
    }

    private static final class TopicBucket {
        final String label;
        long count = 0;

        TopicBucket(String label) {
            this.label = label;
        }
    }

    private record ReportStats(long total, long pending, long resolved, List<Map<String, Object>> reasonsSummary) {}
}
