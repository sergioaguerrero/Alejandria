package com.backend.dto;

import java.util.List;

/**
 * Sobre paginado compatible con el contrato del frontend ({ items, total, page, size, totalPages }).
 */
public record DocumentPageResponse(
        List<DocumentDto> items,
        long total,
        int page,
        int size,
        int totalPages
) {}
