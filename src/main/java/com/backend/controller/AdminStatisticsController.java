package com.backend.controller;

import com.backend.domain.identity.User;
import com.backend.service.JwtTokenService;
import com.backend.service.StatisticsService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Expone los endpoints de estadísticas globales y analítica avanzada para administradores.
 */
@RestController
@RequestMapping("/api/admin/statistics")
public class AdminStatisticsController {

    private final StatisticsService statisticsService;
    private final JwtTokenService jwtTokenService;

    public AdminStatisticsController(StatisticsService statisticsService, JwtTokenService jwtTokenService) {
        this.statisticsService = statisticsService;
        this.jwtTokenService = jwtTokenService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getGlobalStatistics(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        User currentUser = jwtTokenService.resolveUserFromAuthorizationHeader(authorization).orElse(null);
        return ResponseEntity.ok(statisticsService.getGlobalStatistics(currentUser));
    }

    @GetMapping("/advanced")
    public ResponseEntity<Map<String, Object>> getAdvancedStatistics(
            @RequestParam(defaultValue = "week") String period,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        User currentUser = jwtTokenService.resolveUserFromAuthorizationHeader(authorization).orElse(null);
        return ResponseEntity.ok(statisticsService.getAdvancedAdminStatistics(period, currentUser));
    }
}
