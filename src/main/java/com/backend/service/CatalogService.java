package com.backend.service;

import com.backend.domain.academy.Subject;
import com.backend.dto.SubjectDto;
import com.backend.repository.CatalogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Gestiona las consultas de solo lectura sobre el catálogo académico de materias
 * invocando PKG_REPOSITORIOS.fn_listar_materias_catalogo.
 */
@Service
public class CatalogService {

    private final CatalogRepository catalogRepository;
    private final OraclePackageService oraclePackageService;

    public CatalogService(CatalogRepository catalogRepository, OraclePackageService oraclePackageService) {
        this.catalogRepository = catalogRepository;
        this.oraclePackageService = oraclePackageService;
    }

    @Transactional(readOnly = true)
    public List<SubjectDto> getSubjects(Integer semester) {
        Integer filterSemester = (semester != null && semester > 0) ? semester : null;
        List<Long> ids = oraclePackageService.fnListarMateriasCatalogoIds(null, filterSemester);
        List<Subject> subjects = oraclePackageService.orderByIds(
                ids,
                catalogRepository.findAllById(ids),
                Subject::getId
        );

        return subjects.stream()
                .map(SubjectDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<SubjectDto> getSubjectById(Long id) {
        return catalogRepository.findById(id)
                .map(SubjectDto::fromEntity);
    }
}
