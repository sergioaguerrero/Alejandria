package com.backend.service;

import com.backend.cross.InteractionType;
import com.backend.domain.academy.Subject;
import com.backend.domain.analytic.DemandMetric;
import com.backend.domain.analytic.Interaction;
import com.backend.domain.identity.User;
import com.backend.domain.repos.Resource;
import com.backend.repository.DemandMetricRepository;
import com.backend.repository.InteractionRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnalyticsService {

    private final InteractionRepository interactionRepository;
    private final DemandMetricRepository demandMetricRepository;

    @PersistenceContext
    private EntityManager em;

    @Value("${analytics.salt}")
    private String salt;

    public AnalyticsService(InteractionRepository interactionRepository,
                            DemandMetricRepository demandMetricRepository) {
        this.interactionRepository = interactionRepository;
        this.demandMetricRepository = demandMetricRepository;
    }

    /** Registra una interacción sin hacer esperar al usuario. */
    @Async
    @Transactional
    public void logInteraction(InteractionType type, Long userId, Long resourceId,
                               Long subjectId, String searchTerm) {
        try {
            Interaction interaction = new Interaction(
                    type,
                    searchTerm,
                    anonymize(userId),
                    em.getReference(User.class, userId),
                    resourceId == null ? null : em.getReference(Resource.class, resourceId),
                    subjectId == null ? null : em.getReference(Subject.class, subjectId)
            );
            interactionRepository.save(interaction);
        } catch (Exception e) {
            // La analítica nunca debe romper la acción principal del usuario
            System.err.println("No se pudo registrar la interacción: " + e.getMessage());
        }
    }

    /** Agrupa las interacciones del rango y guarda una métrica por materia. */
    @Transactional
    public List<DemandMetric> calculateMetrics(String academicPeriod,
                                               LocalDateTime from, LocalDateTime to) {
        Map<Long, int[]> totals = new HashMap<>();   // [vistas, descargas, búsquedas]

        for (Object[] row : interactionRepository.countBySubjectAndType(from, to)) {
            Long subjectId = (Long) row[0];
            InteractionType type = (InteractionType) row[1];
            int count = ((Long) row[2]).intValue();
            int[] t = totals.computeIfAbsent(subjectId, k -> new int[3]);
            switch (type) {
                case VIEW -> t[0] += count;
                case DOWNLOAD -> t[1] += count;
                case SEARCH -> t[2] += count;
                default -> { }
            }
        }

        List<DemandMetric> result = new ArrayList<>();
        for (Map.Entry<Long, int[]> e : totals.entrySet()) {
            int[] t = e.getValue();
            double index = t[0] * 1.0 + t[1] * 2.0 + t[2] * 1.5;   // pesos de ejemplo

            DemandMetric metric = demandMetricRepository
                    .findBySubject_IdAndAcademicPeriod(e.getKey(), academicPeriod)
                    .orElseGet(() -> new DemandMetric(
                            em.getReference(Subject.class, e.getKey()), academicPeriod));

            metric.update(t[0], t[1], t[2], index);
            result.add(demandMetricRepository.save(metric));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<DemandMetric> mostQueriedSubjects(String academicPeriod, int n) {
        return demandMetricRepository
                .findByAcademicPeriodOrderByTotalQueriesDesc(academicPeriod, PageRequest.of(0, n));
    }

    @Transactional(readOnly = true)
    public List<Object[]> mostSearchedTopics(int n) {
        return interactionRepository.topSearchTerms(PageRequest.of(0, n));
    }

    /** CSV sin ningún dato que identifique al usuario. */
    @Transactional(readOnly = true)
    public String exportAnonymizedData(LocalDateTime from, LocalDateTime to) {
        StringBuilder csv = new StringBuilder(
                "anonymous_user_id,type,date,subject_id,resource_id,search_term\n");
        for (Interaction i : interactionRepository.findByDateBetween(from, to)) {
            csv.append(i.getAnonymousUserId()).append(',')
                    .append(i.getType()).append(',')
                    .append(i.getDate()).append(',')
                    .append(i.getSubject() == null ? "" : i.getSubject().getId()).append(',')
                    .append(i.getResource() == null ? "" : i.getResource().getId()).append(',')
                    .append(escape(i.getSearchTerm())).append('\n');
        }
        return csv.toString();
    }

    private String anonymize(Long userId) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest((salt + userId).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);   // 64 caracteres
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo anonimizar el id", e);
        }
    }

    private String escape(String value) {
        if (value == null) return "";
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}