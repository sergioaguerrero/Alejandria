package com.backend.controller;

import com.backend.domain.identity.User;
import com.backend.dto.ReportResponseDto;
import com.backend.dto.ResolveReportRequest;
import com.backend.service.ModerationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.List;

/**
 * Bandeja y resolución de reportes para administradores.
 */
@RestController
@RequestMapping("/api/admin/reports")
public class AdminReportController {

    private final ModerationService moderationService;

    public AdminReportController(ModerationService moderationService) {
        this.moderationService = moderationService;
    }

    @GetMapping
    public ResponseEntity<List<ReportResponseDto>> listReports(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(moderationService.getReports(status, reason, currentUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReportResponseDto> getReportDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(moderationService.getReportById(id, currentUser, currentBaseUrl()));
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<ReportResponseDto> resolveReport(
            @PathVariable Long id,
            @RequestBody ResolveReportRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(
                moderationService.resolveReport(id, request, currentUser, currentBaseUrl())
        );
    }

    private String currentBaseUrl() {
        return ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
    }
}
