package com.backend.dto;

import java.util.List;

/**
 * Sobre paginado compatible con el contrato del frontend ({ items, total, page, size, totalPages }).
 */
public record RepositoryPageResponse(
        List<RepositoryResponseDto> items,
        long total,
        int page,
        int size,
        int totalPages
) {}
