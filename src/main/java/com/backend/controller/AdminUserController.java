package com.backend.controller;

import com.backend.domain.identity.User;
import com.backend.dto.AdminUserResponseDto;
import com.backend.dto.ToggleSuspensionRequest;
import com.backend.service.AdminUserService;
import com.backend.service.JwtTokenService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Endpoints administrativos para consultar historial de sanciones y suspender/reactivar usuarios.
 */
@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final JwtTokenService jwtTokenService;

    public AdminUserController(AdminUserService adminUserService, JwtTokenService jwtTokenService) {
        this.adminUserService = adminUserService;
        this.jwtTokenService = jwtTokenService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<AdminUserResponseDto> getAdminUser(
            @PathVariable String userId,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(adminUserService.getAdminUser(userId, resolveUser(authorization)));
    }

    @PostMapping("/{userId}/toggle-suspension")
    public ResponseEntity<Map<String, Object>> toggleSuspension(
            @PathVariable String userId,
            @RequestBody(required = false) ToggleSuspensionRequest request,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        String reason = request != null ? request.getReason() : null;
        return ResponseEntity.ok(adminUserService.toggleSuspension(userId, reason, resolveUser(authorization)));
    }

    private User resolveUser(String authorization) {
        return jwtTokenService.resolveUserFromAuthorizationHeader(authorization).orElse(null);
    }
}
