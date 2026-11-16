package com.backend.controller;

import com.backend.domain.academy.Subject;
import com.backend.dto.SubjectDto;
import com.backend.repository.CatalogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Expone el catálogo académico de materias para el frontend.
 */
@RestController
@RequestMapping("/api")
public class CatalogController {

    private final CatalogRepository catalogRepository;

    public CatalogController(CatalogRepository catalogRepository) {
        this.catalogRepository = catalogRepository;
    }

    @GetMapping({"/subjects", "/catalog/subjects"})
    public ResponseEntity<List<SubjectDto>> getSubjects(@RequestParam(required = false) Integer semester) {
        List<Subject> subjects = (semester != null && semester > 0)
                ? catalogRepository.findSubjectBySemesterNumber(semester)
                : catalogRepository.findAllSubject();

        List<SubjectDto> dtoList = subjects.stream()
                .map(SubjectDto::fromEntity)
                .toList();

        return ResponseEntity.ok(dtoList);
    }

    @GetMapping({"/subjects/{id}", "/catalog/subjects/{id}"})
    public ResponseEntity<SubjectDto> getSubjectById(@PathVariable Long id) {
        return catalogRepository.findByIdWithSemester(id)
                .map(SubjectDto::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
