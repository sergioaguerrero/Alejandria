package com.backend.controller;

import com.backend.dto.SubjectDto;
import com.backend.service.CatalogService;
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

    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping({"/subjects", "/catalog/subjects"})
    public ResponseEntity<List<SubjectDto>> getSubjects(@RequestParam(required = false) Integer semester) {
        return ResponseEntity.ok(catalogService.getSubjects(semester));
    }

    @GetMapping({"/subjects/{id}", "/catalog/subjects/{id}"})
    public ResponseEntity<SubjectDto> getSubjectById(@PathVariable Long id) {
        return catalogService.getSubjectById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
