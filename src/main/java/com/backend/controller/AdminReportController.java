package com.backend.controller;

import com.backend.domain.identity.User;
import com.backend.dto.ReportResponseDto;
import com.backend.dto.ResolveReportRequest;
import com.backend.service.JwtTokenService;
import com.backend.service.ModerationService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
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
    private final JwtTokenService jwtTokenService;

    public AdminReportController(ModerationService moderationService, JwtTokenService jwtTokenService) {
        this.moderationService = moderationService;
        this.jwtTokenService = jwtTokenService;
    }

    @GetMapping
    public ResponseEntity<List<ReportResponseDto>> listReports(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String reason,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(moderationService.getReports(status, reason, resolveUser(authorization)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReportResponseDto> getReportDetail(
            @PathVariable Long id,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(moderationService.getReportById(id, resolveUser(authorization), currentBaseUrl()));
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<ReportResponseDto> resolveReport(
            @PathVariable Long id,
            @RequestBody ResolveReportRequest request,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(
                moderationService.resolveReport(id, request, resolveUser(authorization), currentBaseUrl())
        );
    }

    private User resolveUser(String authorization) {
        return jwtTokenService.resolveUserFromAuthorizationHeader(authorization).orElse(null);
    }

    private String currentBaseUrl() {
        return ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
    }
}
