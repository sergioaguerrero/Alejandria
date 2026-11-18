package com.backend.controller;

import com.backend.domain.identity.User;
import com.backend.dto.CreateReportRequest;
import com.backend.dto.ReportResponseDto;
import com.backend.service.ModerationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Expone el endpoint de creación de reportes para estudiantes autenticados.
 */
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ModerationService moderationService;

    public ReportController(ModerationService moderationService) {
        this.moderationService = moderationService;
    }

    @PostMapping
    public ResponseEntity<ReportResponseDto> createReport(
            @RequestBody CreateReportRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(moderationService.createReport(request, currentUser));
    }
}
