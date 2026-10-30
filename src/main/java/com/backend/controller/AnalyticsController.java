package com.backend.controller;

import com.backend.cross.InteractionType;
import com.backend.domain.analytic.DemandMetric;
import com.backend.service.AnalyticsService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    // Inyección del servicio hiper-optimizado
    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /** 1. Endpoint silencioso: Registra cuando un estudiante interactúa */
    @PostMapping("/interaction")
    public ResponseEntity<Void> logInteraction(
            @RequestParam InteractionType type,
            @RequestParam Long userId,
            @RequestParam(required = false) Long resourceId,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String searchTerm) {

        // Como el servicio tiene @Async, esto se ejecutará en segundo plano
        analyticsService.logInteraction(type, userId, resourceId, subjectId, searchTerm);

        // Respondemos un "200 OK" vacío inmediatamente para no hacer esperar a React
        return ResponseEntity.ok().build();
    }

    /** 2. Endpoint para el Dashboard del Administrador: Top Materias */
    @GetMapping("/top-subjects")
    public ResponseEntity<List<DemandMetric>> getTopSubjects(
            @RequestParam String period,
            @RequestParam(defaultValue = "5") int limit) {

        List<DemandMetric> topSubjects = analyticsService.mostQueriedSubjects(period, limit);
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

        // Magia de Spring Boot: Le decimos al navegador de React que esto es un archivo descargable
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"reporte_alejandria.csv\"")
                .contentType(MediaType.TEXT_PLAIN)
                .body(csvData);
    }
}