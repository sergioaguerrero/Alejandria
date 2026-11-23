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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;

@Service
public class AnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsService.class);

    private final InteractionRepository interactionRepository;
    private final DemandMetricRepository demandMetricRepository;
    private final OraclePackageService oraclePackageService;

    @PersistenceContext
    private EntityManager em;

    @Value("${analytics.salt}")
    private String salt;

    public AnalyticsService(
            InteractionRepository interactionRepository,
            DemandMetricRepository demandMetricRepository,
            OraclePackageService oraclePackageService
    ) {
        this.interactionRepository = interactionRepository;
        this.demandMetricRepository = demandMetricRepository;
        this.oraclePackageService = oraclePackageService;
    }

    /** Registra una interacción sin hacer esperar al usuario. */
    @Async
    @Transactional
    public void logInteraction(InteractionType type, Long userId, Long resourceId,
                               Long subjectId, String searchTerm) {
        recordInteraction(type, userId, resourceId, subjectId, searchTerm);
    }

    /** Persiste una interacción de forma segura (acepta usuario, recurso o materia opcionales). */
    @Transactional
    public void recordInteraction(InteractionType type, Long userId, Long resourceId,
                                  Long subjectId, String searchTerm) {
        try {
            String cleanSearch = (searchTerm == null || searchTerm.isBlank()) ? null : searchTerm.trim();
            if (cleanSearch != null && cleanSearch.length() > 200) {
                cleanSearch = cleanSearch.substring(0, 200);
            }
            Interaction interaction = new Interaction(
                    type,
                    cleanSearch,
                    userId == null ? "anon" : anonymize(userId),
                    userId == null ? null : em.getReference(User.class, userId),
                    resourceId == null ? null : em.getReference(Resource.class, resourceId),
                    subjectId == null ? null : em.getReference(Subject.class, subjectId)
            );
            interactionRepository.save(interaction);
        } catch (Exception e) {
            log.warn("No se pudo registrar la interacción analítica ({}): {}", type, e.getMessage());
        }
    }

    /** Delega el cálculo y MERGE de métricas de demanda directamente a PKG_ANALITICAS.pr_recalcular_metrica_demanda. */
    @Transactional
    public List<DemandMetric> calculateMetrics(String academicPeriod,
                                               LocalDateTime from, LocalDateTime to) {
        oraclePackageService.prRecalcularMetricaDemanda(academicPeriod, from, to);
        return mostQueriedSubjects(academicPeriod, 100);
    }

    @Transactional(readOnly = true)
    public List<DemandMetric> mostQueriedSubjects(String academicPeriod, int n) {
        List<Long> ids = oraclePackageService.fnMetricasMasConsultadasIds(academicPeriod, n);
        List<DemandMetric> metrics = oraclePackageService.orderByIds(
                ids,
                demandMetricRepository.findAllById(ids),
                DemandMetric::getId
        );
        for (DemandMetric metric : metrics) {
            if (metric.getSubject() != null) {
                metric.getSubject().getId();
            }
        }
        return metrics;
    }

    @Transactional(readOnly = true)
    public List<Object[]> mostSearchedTopics(int n) {
        return oraclePackageService.fnTopTerminosBusqueda(null, n);
    }

    /** CSV sin ningún dato que identifique al usuario, consultado vía PKG_ANALITICAS.fn_interacciones_rango. */
    @Transactional(readOnly = true)
    public String exportAnonymizedData(LocalDateTime from, LocalDateTime to) {
        StringBuilder csv = new StringBuilder(
                "anonymous_user_id,type,date,subject_id,resource_id,search_term\n");
        List<Long> ids = oraclePackageService.fnInteraccionesRangoIds(from, to);
        List<Interaction> interactions = oraclePackageService.orderByIds(
                ids,
                interactionRepository.findAllById(ids),
                Interaction::getId
        );
        for (Interaction i : interactions) {
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
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo anonimizar el id", e);
        }
    }

    private String escape(String value) {
        if (value == null) return "";
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
