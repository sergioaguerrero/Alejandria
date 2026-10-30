package com.backend.controller;

import com.backend.domain.identity.User;
import com.backend.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    // Inyectamos el servicio de negocio aquí
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<User> registerUser(@RequestBody User newUser) {

        // Enviamos el JSON convertido a Java hacia el servicio
        User createdUser = authService.registerUser(newUser);

        // Devolvemos un código HTTP 201 (Creado) y el usuario con su nuevo ID
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
    }
}

