package com.backend.cross;

/**
 * Tipos de imagen personalizables del perfil de usuario almacenados como BLOB en IMAGEN_PERFIL_USUARIO.
 */
public enum ProfileImageType {

    AVATAR(3L * 1024L * 1024L, "foto de perfil"),
    BANNER(5L * 1024L * 1024L, "banner de perfil");

    private final long maxSizeBytes;
    private final String displayName;

    ProfileImageType(long maxSizeBytes, String displayName) {
        this.maxSizeBytes = maxSizeBytes;
        this.displayName = displayName;
    }

    public long getMaxSizeBytes() {
        return maxSizeBytes;
    }

    public String getDisplayName() {
        return displayName;
    }

    public long getMaxSizeMegabytes() {
        return maxSizeBytes / (1024L * 1024L);
    }
}
