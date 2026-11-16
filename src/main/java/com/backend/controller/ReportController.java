package com.backend.controller;

import com.backend.domain.identity.User;
import com.backend.dto.CreateReportRequest;
import com.backend.dto.ReportResponseDto;
import com.backend.service.JwtTokenService;
import com.backend.service.ModerationService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Expone el endpoint de creación de reportes para estudiantes autenticados.
 */
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ModerationService moderationService;
    private final JwtTokenService jwtTokenService;

    public ReportController(ModerationService moderationService, JwtTokenService jwtTokenService) {
        this.moderationService = moderationService;
        this.jwtTokenService = jwtTokenService;
    }

    @PostMapping
    public ResponseEntity<ReportResponseDto> createReport(
            @RequestBody CreateReportRequest request,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        User currentUser = jwtTokenService.resolveUserFromAuthorizationHeader(authorization).orElse(null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(moderationService.createReport(request, currentUser));
    }
}
