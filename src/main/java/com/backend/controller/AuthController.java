package com.backend.controller;

import com.backend.dto.ApiMessageResponse;
import com.backend.dto.AuthResponse;
import com.backend.dto.LoginRequest;
import com.backend.dto.RecoverPasswordRequest;
import com.backend.dto.RegisterRequest;
import com.backend.dto.ResendVerificationRequest;
import com.backend.dto.ResetPasswordRequest;
import com.backend.dto.VerifyEmailRequest;
import com.backend.service.AuthService;
import com.backend.service.PasswordRecoveryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordRecoveryService passwordRecoveryService;

    public AuthController(AuthService authService, PasswordRecoveryService passwordRecoveryService) {
        this.authService = authService;
        this.passwordRecoveryService = passwordRecoveryService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/verify-email")
    public ResponseEntity<AuthResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        AuthResponse response = authService.verifyEmail(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<ApiMessageResponse> resendVerification(
            @Valid @RequestBody ResendVerificationRequest request
    ) {
        ApiMessageResponse response = authService.resendVerification(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/recover")
    public ResponseEntity<Map<String, Object>> recoverPassword(
            @RequestBody RecoverPasswordRequest request,
            HttpServletRequest servletRequest
    ) {
        String origin = servletRequest.getHeader(HttpHeaders.ORIGIN);
        return ResponseEntity.ok(passwordRecoveryService.requestRecovery(request.getEmail(), origin));
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(passwordRecoveryService.resetPassword(request.getToken(), request.getNewPassword()));
    }
}
