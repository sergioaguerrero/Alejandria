package com.backend.service;

import com.backend.domain.identity.User;
import com.backend.exception.AuthException;
import org.springframework.http.HttpStatus;

import java.util.Locale;

/**
 * Utilidad compartida para validar sesión autenticada y permisos de administrador.
 */
public final class AuthGuards {

    private AuthGuards() {
    }

    public static User requireAuthenticated(User user, String message) {
        if (user == null) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", message);
        }
        return user;
    }

    public static User requireAdmin(User user, String forbiddenMessage) {
        User current = requireAuthenticated(user, "Debes iniciar sesión para continuar.");
        if (!isAdmin(current)) {
            throw new AuthException(HttpStatus.FORBIDDEN, "FORBIDDEN", forbiddenMessage);
        }
        return current;
    }

    public static boolean isAdmin(User user) {
        return user != null
                && user.getRole() != null
                && user.getRole().getName() != null
                && user.getRole().getName().toLowerCase(Locale.ROOT).contains("admin");
    }
}
