package com.backend.service;

import com.backend.cross.AiContentType;
import com.backend.domain.repos.Resource;
import com.backend.domain.repos.StudyRepository;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

/**
 * Contrato de generación de contenido académico estructurado mediante IA.
 */
public interface AiGenerationClient {

    JsonNode generateStructuredContent(
            AiContentType contentType,
            StudyRepository repository,
            List<Resource> documents,
            String scopeLabel
    );
}
