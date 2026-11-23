package com.backend.controller;

import com.backend.domain.identity.User;
import com.backend.dto.AdminUserResponseDto;
import com.backend.dto.ToggleSuspensionRequest;
import com.backend.service.AdminUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<AdminUserResponseDto> getAdminUser(
            @PathVariable String userId,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(adminUserService.getAdminUser(userId, currentUser));
    }

    @PostMapping("/{userId}/toggle-suspension")
    public ResponseEntity<Map<String, Object>> toggleSuspension(
            @PathVariable String userId,
            @RequestBody(required = false) ToggleSuspensionRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        String reason = request != null ? request.getReason() : null;
        return ResponseEntity.ok(adminUserService.toggleSuspension(userId, reason, currentUser));
    }
}
