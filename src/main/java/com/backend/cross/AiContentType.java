package com.backend.cross;

import java.util.Locale;

/**
 * Tipos de material académico generables mediante Inteligencia Artificial.
 */
public enum AiContentType {
    QUIZ,
    SUMMARY,
    GUIDE,
    SLIDES;

    public String toFrontendValue() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static AiContentType fromFrontendValue(String raw) {
        if (raw == null || raw.isBlank()) {
            return QUIZ;
        }
        return switch (raw.trim().toLowerCase(Locale.ROOT)) {
            case "quiz", "cuestionario" -> QUIZ;
            case "summary", "resumen" -> SUMMARY;
            case "guide", "guia", "guía" -> GUIDE;
            case "slides", "diapositivas" -> SLIDES;
            default -> throw new IllegalArgumentException("Tipo de contenido IA no soportado: " + raw);
        };
    }
}
