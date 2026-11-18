package com.backend.service;

import com.backend.domain.academy.Subject;
import com.backend.dto.SubjectDto;
import com.backend.repository.CatalogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Gestiona las consultas de solo lectura sobre el catálogo académico de materias.
 */
@Service
public class CatalogService {

    private final CatalogRepository catalogRepository;

    public CatalogService(CatalogRepository catalogRepository) {
        this.catalogRepository = catalogRepository;
    }

    @Transactional(readOnly = true)
    public List<SubjectDto> getSubjects(Integer semester) {
        List<Subject> subjects = (semester != null && semester > 0)
                ? catalogRepository.findSubjectBySemesterNumber(semester)
                : catalogRepository.findAllSubject();

        return subjects.stream()
                .map(SubjectDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<SubjectDto> getSubjectById(Long id) {
        return catalogRepository.findByIdWithSemester(id)
                .map(SubjectDto::fromEntity);
    }
}
