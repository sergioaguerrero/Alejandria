
package com.backend.controller;

import com.backend.domain.governance.Decision;
import com.backend.domain.governance.Report;
import com.backend.service.ModerationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/moderation")
public class ModerationController {

    private final ModerationService moderationService;

    // Inyectamos al servicio de moderación
    public ModerationController(ModerationService moderationService) {
        this.moderationService = moderationService;
    }

    /** 1. Endpoint para el estudiante: Enviar un reporte/denuncia */
    @PostMapping("/report")
    public ResponseEntity<Report> submitReport(@RequestBody Report newReport) {

        // El servicio se encarga de asignarle la fecha actual y el estado OPEN
        Report savedReport = moderationService.submitReport(newReport);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedReport);
    }

    /** 2. Endpoint para el Administrador: Resolver el reporte y aplicar sanción */
    @PostMapping("/{reportId}/resolve")
    public ResponseEntity<Void> resolveReport(
            @PathVariable Long reportId,
            @RequestBody Decision decision,
            @RequestParam Long adminId) {

        // Pasamos el ID del reporte, la decisión (REMOVE, SUSPEND_USER) y quién lo resolvió
        moderationService.resolveReport(reportId, decision, adminId);

        // Si to sale bien y no hay errores, devolvemos un 200 OK vacío
        return ResponseEntity.ok().build();
    }
}