package com.backend.controller;

import com.backend.service.AiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    // Inyectamos el servicio que se conecta a Google Gemini
    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    /** Endpoint para que React solicite el cuestionario de un documento */
    @GetMapping("/quiz/{resourceId}")
    public ResponseEntity<String> generateQuiz(@PathVariable Long resourceId) {

        // Llamamos al servicio pasándole el ID del documento
        String quizResponse = aiService.generateQuiz(resourceId);

        // Devolvemos un 200 OK con el JSON crudo que entregó la IA
        return ResponseEntity.ok(quizResponse);
    }
}