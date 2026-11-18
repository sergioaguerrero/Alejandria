package com.backend.controller;

import com.backend.cross.AiContentType;
import com.backend.domain.identity.User;
import com.backend.service.AiService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Endpoints del módulo Estudio con IA, "Mi estudio" y compartición entre amigos mutuos.
 */
@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @GetMapping("/quota")
    public ResponseEntity<Map<String, Object>> getDailyQuota(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(aiService.getDailyQuota(currentUser));
    }

    @PostMapping("/quiz")
    public ResponseEntity<Map<String, Object>> generateQuiz(
            @RequestBody(required = false) Map<String, Object> body,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(aiService.generateMaterial(AiContentType.QUIZ, body, currentUser));
    }

    @PostMapping("/materials")
    public ResponseEntity<Map<String, Object>> generateMaterial(
            @RequestBody(required = false) Map<String, Object> body,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(aiService.generateMaterial(null, body, currentUser));
    }

    @GetMapping("/quiz/{id}")
    public ResponseEntity<Map<String, Object>> getQuizById(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(aiService.getQuizById(id, currentUser));
    }

    @PostMapping("/quiz/{id}/submit")
    public ResponseEntity<Map<String, Object>> submitQuiz(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> body,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(aiService.submitQuizScore(id, body, currentUser));
    }

    @PostMapping("/quiz/{id}/save")
    public ResponseEntity<Map<String, Object>> toggleSaveQuiz(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> body,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(aiService.toggleSaveToMyStudy(id, body, currentUser));
    }

    @GetMapping("/materials/{id}")
    public ResponseEntity<Map<String, Object>> getMaterialById(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(aiService.getMaterialById(id, currentUser));
    }

    @PostMapping("/materials/{id}/save")
    public ResponseEntity<Map<String, Object>> toggleSaveMaterial(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> body,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(aiService.toggleSaveToMyStudy(id, body, currentUser));
    }

    @GetMapping("/my-study")
    public ResponseEntity<List<Map<String, Object>>> getMyStudyMaterials(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(aiService.getMyStudyMaterials(currentUser));
    }

    @DeleteMapping("/my-study/{id}")
    public ResponseEntity<Map<String, Object>> removeFromMyStudy(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(aiService.removeFromMyStudy(id, currentUser));
    }

    @GetMapping("/materials/{id}/shares")
    public ResponseEntity<List<String>> getSharedFriends(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(aiService.getSharedFriends(id, currentUser));
    }

    @PostMapping("/materials/{id}/share")
    public ResponseEntity<Map<String, Object>> shareWithFriends(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> body,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(aiService.shareWithMutualFriends(id, body, currentUser));
    }

    @GetMapping("/shared-with-me")
    public ResponseEntity<List<Map<String, Object>>> getSharedWithMe(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(aiService.getSharedWithMe(currentUser));
    }
}
