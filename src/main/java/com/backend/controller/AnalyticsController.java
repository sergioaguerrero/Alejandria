package com.backend.controller;

import com.backend.cross.InteractionType;
import com.backend.domain.analytic.DemandMetric;
import com.backend.domain.identity.User;
import com.backend.service.AnalyticsService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /** 1. Endpoint silencioso: Registra cuando el estudiante autenticado interactúa */
    @PostMapping("/interaction")
    public ResponseEntity<Void> logInteraction(
            @RequestParam InteractionType type,
            @RequestParam(required = false) Long resourceId,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String searchTerm,
            @AuthenticationPrincipal User currentUser) {

        Long userId = currentUser != null ? currentUser.getId() : null;
        analyticsService.logInteraction(type, userId, resourceId, subjectId, searchTerm);
        return ResponseEntity.ok().build();
    }

    /** 2. Endpoint para el Dashboard del Administrador: Top Materias */
    @GetMapping("/top-subjects")
    public ResponseEntity<List<Map<String, Object>>> getTopSubjects(
            @RequestParam String period,
            @RequestParam(defaultValue = "5") int limit) {

        List<Map<String, Object>> topSubjects = analyticsService.mostQueriedSubjects(period, limit)
                .stream()
                .map(this::toMetricDto)
                .toList();
        return ResponseEntity.ok(topSubjects);
    }

    /** 3. Endpoint para descargar el reporte CSV en Excel */
    @GetMapping("/export")
    public ResponseEntity<String> exportAnalytics(
            @RequestParam String from,
            @RequestParam String to) {

        LocalDateTime fromDate = LocalDateTime.parse(from);
        LocalDateTime toDate = LocalDateTime.parse(to);

        String csvData = analyticsService.exportAnonymizedData(fromDate, toDate);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"reporte_alejandria.csv\"")
                .contentType(MediaType.TEXT_PLAIN)
                .body(csvData);
    }

    private Map<String, Object> toMetricDto(DemandMetric metric) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", metric.getId());
        dto.put("academicPeriod", metric.getAcademicPeriod());
        dto.put("totalQueries", metric.getTotalQueries());
        dto.put("totalDownloads", metric.getTotalDownloads());
        dto.put("totalSearches", metric.getTotalSearches());
        dto.put("demandIndex", metric.getDemandIndex());
        dto.put("subjectId", metric.getSubject() != null ? metric.getSubject().getId() : null);
        return dto;
    }
}