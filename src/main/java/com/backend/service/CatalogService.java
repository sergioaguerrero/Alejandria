package com.backend.service;

import com.backend.domain.academy.Subject;
import com.backend.dto.SubjectDto;
import com.backend.repository.CatalogRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Gestiona las consultas de solo lectura sobre el catálogo académico de materias
 * invocando PKG_REPOSITORIOS.fn_listar_materias_catalogo.
 */
@Service
public class CatalogService {

    private static final int ALL_SEMESTERS_KEY = 0;

    private record CachedSubjects(List<SubjectDto> items, long expiresAtNanos) {}

    private final CatalogRepository catalogRepository;
    private final OraclePackageService oraclePackageService;
    private final long cacheTtlNanos;
    private final Map<Integer, CachedSubjects> subjectsCache = new ConcurrentHashMap<>();

    public CatalogService(
            CatalogRepository catalogRepository,
            OraclePackageService oraclePackageService,
            @Value("${app.catalog.cache-ttl-seconds:300}") long cacheTtlSeconds
    ) {
        this.catalogRepository = catalogRepository;
        this.oraclePackageService = oraclePackageService;
        this.cacheTtlNanos = Math.max(0L, cacheTtlSeconds) * 1_000_000_000L;
    }

    @Transactional(readOnly = true)
    public List<SubjectDto> getSubjects(Integer semester) {
        Integer filterSemester = (semester != null && semester > 0) ? semester : null;
        int cacheKey = filterSemester != null ? filterSemester : ALL_SEMESTERS_KEY;

        if (cacheTtlNanos > 0L) {
            CachedSubjects cached = subjectsCache.get(cacheKey);
            if (cached != null && System.nanoTime() < cached.expiresAtNanos()) {
                return cached.items();
            }
        }

        List<Long> ids = oraclePackageService.fnListarMateriasCatalogoIds(null, filterSemester);
        List<Subject> subjects = ids.isEmpty()
                ? List.of()
                : oraclePackageService.orderByIds(
                        ids,
                        catalogRepository.findAllById(ids),
                        Subject::getId
                );

        List<SubjectDto> result = subjects.stream()
                .map(SubjectDto::fromEntity)
                .toList();

        if (cacheTtlNanos > 0L) {
            subjectsCache.put(cacheKey, new CachedSubjects(result, System.nanoTime() + cacheTtlNanos));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public Optional<SubjectDto> getSubjectById(Long id) {
        if (cacheTtlNanos > 0L && id != null) {
            CachedSubjects allCached = subjectsCache.get(ALL_SEMESTERS_KEY);
            if (allCached != null && System.nanoTime() < allCached.expiresAtNanos()) {
                return allCached.items().stream()
                        .filter(s -> id.equals(s.getId()))
                        .findFirst();
            }
        }
        return catalogRepository.findById(id)
                .map(SubjectDto::fromEntity);
    }
}
