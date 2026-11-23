package com.backend.cross;

import java.util.Locale;
import java.util.Optional;

/**
 * Plataformas o canales admitidos para los medios de contacto del perfil de usuario.
 */
public enum ContactMethodType {
    EMAIL,
    WHATSAPP,
    INSTAGRAM,
    LINKEDIN,
    GITHUB,
    TELEGRAM,
    DISCORD,
    WEBSITE,
    OTHER;

    public static Optional<ContactMethodType> fromValue(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(ContactMethodType.valueOf(raw.trim().toUpperCase(Locale.ROOT)));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }
}
