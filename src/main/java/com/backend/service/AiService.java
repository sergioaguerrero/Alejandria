package com.backend.service;

import com.backend.domain.repos.Resource;
import com.backend.repository.ResourceRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

@Service
public class AiService {

    private final ResourceRepository resourceRepository;
    private final RestTemplate restTemplate;

    @Value("${ai.api.url}")
    private String apiUrl;

    @Value("${ai.api.key}")
    private String apiKey;

    public AiService(ResourceRepository resourceRepository, RestTemplate restTemplate) {
        this.resourceRepository = resourceRepository;
        this.restTemplate = restTemplate;
    }

    public String generateQuiz(Long resourceId) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new IllegalArgumentException("documento no encontrado."));

        String prompt = "Genera un cuestionario de 5 preguntas de selección múltiple " +
                "con sus respuestas basado en este tema: " + resource.getTitle();

        // Armamos la URL completa concatenando la clave de seguridad
        String fullUrl = apiUrl + apiKey;

        // Configuramos que vamos a enviar un JSON
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Estructura JSON estricta que exige Gemini
        String requestBody = """
            {
              "contents": [{
                "parts":[{"text": "%s"}]
              }]
            }
            """.formatted(prompt);

        HttpEntity<String> request = new HttpEntity<>(requestBody, headers);

        try {
            //Hacemos el POST y recibimos la respuesta de la IA en formato JSON
            return restTemplate.postForObject(fullUrl, request, String.class);
        } catch (Exception e) {
            throw new RuntimeException("error de comunicacion con el proveEEedor de IA: " + e.getMessage());
        }
    }
}