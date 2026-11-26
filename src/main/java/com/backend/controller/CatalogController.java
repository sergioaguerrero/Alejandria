package com.backend.controller;

import com.backend.dto.SubjectDto;
import com.backend.service.CatalogService;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Expone el catálogo académico de materias para el frontend con caché HTTP de 5 minutos.
 */
@RestController
@RequestMapping("/api")
public class CatalogController {

    private static final CacheControl SUBJECTS_CACHE_CONTROL =
            CacheControl.maxAge(5, TimeUnit.MINUTES).cachePublic();

    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping({"/subjects", "/catalog/subjects"})
    public ResponseEntity<List<SubjectDto>> getSubjects(@RequestParam(required = false) Integer semester) {
        return ResponseEntity.ok()
                .cacheControl(SUBJECTS_CACHE_CONTROL)
                .body(catalogService.getSubjects(semester));
    }

    @GetMapping({"/subjects/{id}", "/catalog/subjects/{id}"})
    public ResponseEntity<SubjectDto> getSubjectById(@PathVariable Long id) {
        return catalogService.getSubjectById(id)
                .map(subject -> ResponseEntity.ok()
                        .cacheControl(SUBJECTS_CACHE_CONTROL)
                        .body(subject))
                .orElse(ResponseEntity.notFound().build());
    }
}
