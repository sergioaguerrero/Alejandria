package com.backend.service;

import com.backend.cross.AiContentType;
import com.backend.cross.NotificationType;
import com.backend.domain.ai.AiMaterial;
import com.backend.domain.ai.AiShare;
import com.backend.domain.identity.User;
import com.backend.domain.repos.Resource;
import com.backend.domain.repos.StudyRepository;
import com.backend.exception.AuthException;
import com.backend.repository.AiMaterialRepository;
import com.backend.repository.AiShareRepository;
import com.backend.repository.ResourceRepository;
import com.backend.repository.StudyRepositoryRepository;
import com.backend.repository.UserFollowRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Orquesta generación de contenido de estudio con IA, cuota diaria, biblioteca "Mi estudio"
 * y compartición exclusiva entre amigos mutuos.
 */
@Service
public class AiService {

    private static final Set<String> VALID_SCOPES = Set.of("all", "term", "topic", "tag");
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final AiMaterialRepository aiMaterialRepository;
    private final AiShareRepository aiShareRepository;
    private final StudyRepositoryRepository studyRepositoryRepository;
    private final ResourceRepository resourceRepository;
    private final UserFollowRepository userFollowRepository;
    private final NotificationService notificationService;
    private final AiGenerationClient aiGenerationClient;
    private final ObjectMapper objectMapper;
    private final int dailyLimit;

    public AiService(
            AiMaterialRepository aiMaterialRepository,
            AiShareRepository aiShareRepository,
            StudyRepositoryRepository studyRepositoryRepository,
            ResourceRepository resourceRepository,
            UserFollowRepository userFollowRepository,
            NotificationService notificationService,
            AiGenerationClient aiGenerationClient,
            ObjectMapper objectMapper,
            @Value("${ai.daily-limit:5}") int dailyLimit
    ) {
        this.aiMaterialRepository = aiMaterialRepository;
        this.aiShareRepository = aiShareRepository;
        this.studyRepositoryRepository = studyRepositoryRepository;
        this.resourceRepository = resourceRepository;
        this.userFollowRepository = userFollowRepository;
        this.notificationService = notificationService;
        this.aiGenerationClient = aiGenerationClient;
        this.objectMapper = objectMapper;
        this.dailyLimit = Math.max(1, dailyLimit);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDailyQuota(User currentUser) {
        User user = requireAuthenticated(currentUser, "Inicia sesión para usar el generador con IA.");
        long used = countTodayGenerations(user.getId());
        long remaining = Math.max(0L, dailyLimit - used);

        Map<String, Object> quota = new LinkedHashMap<>();
        quota.put("total", dailyLimit);
        quota.put("used", used);
        quota.put("remaining", remaining);
        return quota;
    }

    @Transactional
    public Map<String, Object> generateMaterial(
            AiContentType forcedType,
            Map<String, Object> body,
            User currentUser
    ) {
        User user = requireAuthenticated(currentUser, "Debes iniciar sesión para generar materiales con IA.");
        Map<String, Object> safeBody = body == null ? Map.of() : body;

        AiContentType contentType = resolveContentType(forcedType, safeBody.get("contentType"));
        Long repositoryId = parseRequiredId(safeBody.get("repositoryId"), "Selecciona un repositorio válido.");
        ScopeSpec scopeSpec = parseScope(safeBody.get("scope"), safeBody.get("scopeValue"));

        long usedToday = countTodayGenerations(user.getId());
        if (usedToday >= dailyLimit) {
            throw new AuthException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "AI_QUOTA_EXCEEDED",
                    "Has alcanzado el límite diario de " + dailyLimit + " generaciones con IA. Vuelve mañana para generar más."
            );
        }

        StudyRepository repo = studyRepositoryRepository.findByIdWithDetails(repositoryId)
                .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "REPO_NOT_FOUND", "El repositorio seleccionado no existe o fue eliminado."));

        List<Resource> repoDocs = resourceRepository.findByStudyRepositoryIdWithDetails(repo.getId());
        if (repoDocs.isEmpty()) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "EMPTY_REPOSITORY",
                    "Este repositorio aún no tiene documentos publicados para analizar con IA."
            );
        }

        List<Resource> targetDocs = filterDocumentsByScope(repoDocs, scopeSpec);
        JsonNode generatedNode = aiGenerationClient.generateStructuredContent(contentType, repo, targetDocs, scopeSpec.label());
        NormalizedPayload normalized = normalizeGeneratedPayload(contentType, repo, generatedNode);

        String subjectName = repo.getSubject() != null ? repo.getSubject().getName() : "Materia";
        AiMaterial material = new AiMaterial(
                user,
                repo,
                contentType,
                truncate(normalized.title(), 255),
                truncate(repo.getName(), 200),
                truncate(subjectName, 200),
                scopeSpec.scope(),
                scopeSpec.scopeValue(),
                truncate(scopeSpec.label(), 255),
                normalized.contentJson()
        );
        AiMaterial saved = aiMaterialRepository.save(material);
        return toMaterialDto(saved, null);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getQuizById(String rawId, User currentUser) {
        User user = requireAuthenticated(currentUser, "Inicia sesión para acceder a este cuestionario.");
        AiMaterial material = findMaterialOrThrow(rawId, "El cuestionario no existe o fue eliminado.");
        if (material.getContentType() != AiContentType.QUIZ) {
            throw new AuthException(HttpStatus.NOT_FOUND, "QUIZ_NOT_FOUND", "El cuestionario no existe o fue eliminado.");
        }
        AiShare share = resolveReadableShare(material, user, "No tienes permiso para ver este cuestionario.");
        return toMaterialDto(material, share);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMaterialById(String rawId, User currentUser) {
        User user = requireAuthenticated(currentUser, "Inicia sesión para acceder a este material.");
        AiMaterial material = findMaterialOrThrow(rawId, "El material generado no existe o fue eliminado.");
        AiShare share = resolveReadableShare(material, user, "No tienes permiso para ver este material de IA.");
        return toMaterialDto(material, share);
    }

    @Transactional
    public Map<String, Object> submitQuizScore(String rawId, Map<String, Object> body, User currentUser) {
        User user = requireAuthenticated(currentUser, "Inicia sesión para registrar tu puntaje.");
        AiMaterial material = findMaterialOrThrow(rawId, "Cuestionario no encontrado.");
        if (material.getContentType() != AiContentType.QUIZ) {
            throw new AuthException(HttpStatus.NOT_FOUND, "QUIZ_NOT_FOUND", "Cuestionario no encontrado.");
        }
        AiShare share = resolveReadableShare(material, user, "No tienes permiso para responder este cuestionario.");

        Integer score = parseScore(body != null ? body.get("score") : null);
        if (share == null) {
            material.setLastScore(score);
            material = aiMaterialRepository.save(material);
        }

        Map<String, Object> dto = toMaterialDto(material, share);
        dto.put("lastScore", score);
        return dto;
    }

    @Transactional
    public Map<String, Object> toggleSaveToMyStudy(String rawId, Map<String, Object> body, User currentUser) {
        User user = requireAuthenticated(currentUser, "Inicia sesión para guardar contenidos.");
        AiMaterial material = findMaterialOrThrow(rawId, "Material no encontrado.");
        requireOwner(material, user, "Solo el autor puede guardar este contenido en Mi estudio.");

        boolean save = true;
        if (body != null && body.containsKey("save") && body.get("save") != null) {
            Object rawSave = body.get("save");
            save = rawSave instanceof Boolean b ? b : Boolean.parseBoolean(String.valueOf(rawSave));
        }
        material.setSavedInMyStudy(save);
        AiMaterial saved = aiMaterialRepository.save(material);
        return toMaterialDto(saved, null);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMyStudyMaterials(User currentUser) {
        User user = requireAuthenticated(currentUser, "Inicia sesión para ver tu material de estudio guardado.");
        return aiMaterialRepository.findSavedByOwnerId(user.getId())
                .stream()
                .map(m -> toMaterialDto(m, null))
                .toList();
    }

    @Transactional
    public Map<String, Object> removeFromMyStudy(String rawId, User currentUser) {
        User user = requireAuthenticated(currentUser, "Inicia sesión para realizar esta acción.");
        AiMaterial material = findMaterialOrThrow(rawId, "Material no encontrado.");
        requireOwner(material, user, "Solo puedes modificar tu propia biblioteca de estudio.");

        material.setSavedInMyStudy(false);
        aiMaterialRepository.save(material);
        return Map.of("success", true);
    }

    @Transactional(readOnly = true)
    public List<String> getSharedFriends(String rawId, User currentUser) {
        User user = requireAuthenticated(currentUser, "Inicia sesión para consultar compartidos.");
        AiMaterial material = findMaterialOrThrow(rawId, "El contenido de IA no existe o fue eliminado.");
        requireOwner(material, user, "Solo puedes consultar compartidos de tu propio material.");

        return aiShareRepository.findByMaterialIdAndSenderId(material.getId(), user.getId())
                .stream()
                .map(share -> share.getRecipient().getUsername())
                .toList();
    }

    @Transactional
    public Map<String, Object> shareWithMutualFriends(String rawId, Map<String, Object> body, User currentUser) {
        User user = requireAuthenticated(currentUser, "Debes iniciar sesión para compartir contenido con tus amigos.");
        AiMaterial material = findMaterialOrThrow(rawId, "El contenido de IA no existe o fue eliminado.");
        requireOwner(material, user, "Solo puedes compartir contenido de IA generado por ti.");

        List<String> targets = extractTargetUsernames(body != null ? body.get("friendUsernames") : null);
        if (targets.isEmpty()) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Selecciona al menos un amigo para compartir.");
        }

        String rawNote = body != null && body.get("note") != null ? String.valueOf(body.get("note")).trim() : "";
        String cleanNote = truncate(rawNote, 500);

        List<User> mutualFriends = userFollowRepository.findMutualFriends(user.getId());
        Map<String, User> friendsByUsername = new LinkedHashMap<>();
        for (User friend : mutualFriends) {
            friendsByUsername.put(friend.getUsername().toLowerCase(Locale.ROOT), friend);
        }

        for (String target : targets) {
            if (!friendsByUsername.containsKey(target)) {
                throw new AuthException(
                        HttpStatus.FORBIDDEN,
                        "NOT_MUTUAL_FRIEND",
                        "@" + target + " no es tu amigo mutuo. Solo puedes compartir contenido de IA con amigos."
                );
            }
        }

        String targetUrl = material.getContentType() == AiContentType.QUIZ
                ? "/ai/quiz/" + material.getId()
                : "/ai/material/" + material.getId();

        LocalDateTime now = LocalDateTime.now();
        for (String target : targets) {
            User friend = friendsByUsername.get(target);
            Optional<AiShare> existingOpt = aiShareRepository.findByMaterialIdAndRecipientId(material.getId(), friend.getId());
            if (existingOpt.isPresent()) {
                AiShare existing = existingOpt.get();
                if (!cleanNote.isEmpty()) {
                    existing.setNote(cleanNote);
                }
                existing.setSharedAt(now);
                aiShareRepository.save(existing);
            } else {
                aiShareRepository.save(new AiShare(material, user, friend, cleanNote.isEmpty() ? null : cleanNote));
            }

            notificationService.create(
                    friend,
                    NotificationType.AI_SHARED,
                    "Contenido de IA compartido",
                    "@" + user.getUsername() + " compartió contigo \"" + material.getTitle() + "\".",
                    targetUrl
            );
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sharedCount", targets.size());
        result.put("sharedWith", targets);
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSharedWithMe(User currentUser) {
        User user = requireAuthenticated(currentUser, "Inicia sesión para ver el contenido compartido contigo.");
        return aiShareRepository.findSharedWithRecipient(user.getId())
                .stream()
                .map(share -> toMaterialDto(share.getMaterial(), share))
                .toList();
    }

    private long countTodayGenerations(Long userId) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        return aiMaterialRepository.countByOwnerIdAndCreatedAtGreaterThanEqual(userId, startOfDay);
    }

    private AiContentType resolveContentType(AiContentType forcedType, Object rawType) {
        if (forcedType != null) {
            return forcedType;
        }
        try {
            return AiContentType.fromFrontendValue(rawType == null ? null : String.valueOf(rawType));
        } catch (IllegalArgumentException ex) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "INVALID_CONTENT_TYPE", ex.getMessage());
        }
    }

    private ScopeSpec parseScope(Object rawScopeObj, Object rawValueObj) {
        String scope = rawScopeObj == null ? "all" : String.valueOf(rawScopeObj).trim().toLowerCase(Locale.ROOT);
        if (scope.isEmpty()) {
            scope = "all";
        }
        if (!VALID_SCOPES.contains(scope)) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "INVALID_SCOPE", "Alcance de estudio inválido: " + scope);
        }
        String rawVal = rawValueObj == null ? "" : String.valueOf(rawValueObj).trim();
        return switch (scope) {
            case "term" -> {
                int term = 1;
                if (!rawVal.isEmpty()) {
                    try {
                        term = Math.max(1, Math.min(3, Integer.parseInt(rawVal)));
                    } catch (NumberFormatException ignored) {
                        term = 1;
                    }
                }
                yield new ScopeSpec("term", String.valueOf(term), "Corte " + term);
            }
            case "topic" -> {
                String clean = rawVal.isEmpty() ? "General" : rawVal;
                yield new ScopeSpec("topic", clean, "Tema: " + clean);
            }
            case "tag" -> {
                String clean = rawVal.isEmpty() ? "General" : rawVal;
                yield new ScopeSpec("tag", clean, "Etiqueta: " + clean);
            }
            default -> new ScopeSpec("all", null, "Todo el repositorio");
        };
    }

    private List<Resource> filterDocumentsByScope(List<Resource> repoDocs, ScopeSpec scopeSpec) {
        if ("all".equals(scopeSpec.scope())) {
            return repoDocs;
        }
        List<Resource> filtered = repoDocs.stream()
                .filter(doc -> matchesScope(doc, scopeSpec))
                .toList();
        return filtered.isEmpty() ? repoDocs : filtered;
    }

    private boolean matchesScope(Resource doc, ScopeSpec spec) {
        return switch (spec.scope()) {
            case "term" -> String.valueOf(doc.getTerm()).equals(spec.scopeValue());
            case "topic" -> doc.getTopic() != null
                    && doc.getTopic().toLowerCase(Locale.ROOT).contains(spec.scopeValue().toLowerCase(Locale.ROOT));
            case "tag" -> doc.getTags() != null && doc.getTags().stream()
                    .anyMatch(t -> t.getName().toLowerCase(Locale.ROOT).contains(spec.scopeValue().toLowerCase(Locale.ROOT)));
            default -> true;
        };
    }

    private NormalizedPayload normalizeGeneratedPayload(
            AiContentType contentType,
            StudyRepository repo,
            JsonNode generatedNode
    ) {
        if (generatedNode == null || !generatedNode.isObject()) {
            throw new AuthException(HttpStatus.BAD_GATEWAY, "AI_INVALID_JSON", "La IA devolvió una estructura inválida.");
        }

        ObjectNode copy = ((ObjectNode) generatedNode).deepCopy();
        String fallbackTitle = defaultTitlePrefix(contentType) + ": " + repo.getName();
        String title = nonBlankOrDefault(copy.path("title").asText(null), fallbackTitle);
        copy.remove("title");

        switch (contentType) {
            case QUIZ -> normalizeQuizPayload(copy);
            case SUMMARY -> normalizeSummaryPayload(copy);
            case GUIDE -> normalizeGuidePayload(copy);
            case SLIDES -> normalizeSlidesPayload(copy);
        }

        try {
            return new NormalizedPayload(title, objectMapper.writeValueAsString(copy));
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo guardar el material generado.", ex);
        }
    }

    private void normalizeQuizPayload(ObjectNode root) {
        JsonNode rawQuestions = root.path("questions");
        if (!rawQuestions.isArray() || rawQuestions.isEmpty()) {
            throw new AuthException(HttpStatus.BAD_GATEWAY, "AI_INVALID_JSON", "La IA no devolvió preguntas válidas para el cuestionario.");
        }
        ArrayNode normalizedQuestions = objectMapper.createArrayNode();
        int idx = 1;
        for (JsonNode qNode : rawQuestions) {
            if (!qNode.isObject()) continue;
            String questionText = qNode.path("question").asText("").trim();
            JsonNode optsNode = qNode.path("options");
            if (questionText.isEmpty() || !optsNode.isArray() || optsNode.size() < 2) continue;

            ObjectNode normalizedQ = normalizedQuestions.addObject();
            normalizedQ.put("id", idx++);
            normalizedQ.put("question", questionText);
            ArrayNode normalizedOpts = normalizedQ.putArray("options");
            int optCount = 0;
            for (JsonNode opt : optsNode) {
                if (optCount >= 4) break;
                normalizedOpts.add(opt.asText(""));
                optCount++;
            }
            int rawCorrect = qNode.path("correctIndex").asInt(0);
            int clampedCorrect = Math.max(0, Math.min(normalizedOpts.size() - 1, rawCorrect));
            normalizedQ.put("correctIndex", clampedCorrect);
            normalizedQ.put("explanation", nonBlankOrDefault(qNode.path("explanation").asText(null), "Revisa los apuntes del repositorio."));
        }
        if (normalizedQuestions.isEmpty()) {
            throw new AuthException(HttpStatus.BAD_GATEWAY, "AI_INVALID_JSON", "No se pudieron estructurar preguntas válidas desde la respuesta de IA.");
        }
        root.set("questions", normalizedQuestions);
    }

    private void normalizeSummaryPayload(ObjectNode root) {
        if (!root.path("sections").isArray() || root.path("sections").isEmpty()) {
            throw new AuthException(HttpStatus.BAD_GATEWAY, "AI_INVALID_JSON", "La IA no devolvió secciones válidas para el resumen.");
        }
        int minutes = root.path("estimatedReadMinutes").asInt(5);
        root.put("estimatedReadMinutes", Math.max(1, Math.min(60, minutes)));
    }

    private void normalizeGuidePayload(ObjectNode root) {
        if (!root.path("modules").isArray() || root.path("modules").isEmpty()) {
            throw new AuthException(HttpStatus.BAD_GATEWAY, "AI_INVALID_JSON", "La IA no devolvió módulos válidos para la guía de estudio.");
        }
    }

    private void normalizeSlidesPayload(ObjectNode root) {
        JsonNode rawSlides = root.path("slides");
        if (!rawSlides.isArray() || rawSlides.isEmpty()) {
            throw new AuthException(HttpStatus.BAD_GATEWAY, "AI_INVALID_JSON", "La IA no devolvió diapositivas válidas.");
        }
        ArrayNode normalized = objectMapper.createArrayNode();
        int slideNumber = 1;
        for (JsonNode s : rawSlides) {
            if (!s.isObject()) continue;
            ObjectNode slideCopy = ((ObjectNode) s).deepCopy();
            slideCopy.put("slideNumber", slideNumber++);
            normalized.add(slideCopy);
        }
        if (normalized.isEmpty()) {
            throw new AuthException(HttpStatus.BAD_GATEWAY, "AI_INVALID_JSON", "La IA no devolvió diapositivas válidas.");
        }
        root.set("slides", normalized);
    }

    private Map<String, Object> toMaterialDto(AiMaterial material, AiShare share) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", String.valueOf(material.getId()));
        dto.put("contentType", material.getContentType().toFrontendValue());
        dto.put("title", material.getTitle());
        dto.put("repositoryId", material.getStudyRepository() != null ? String.valueOf(material.getStudyRepository().getId()) : null);
        dto.put("repositoryName", material.getRepositoryName());
        dto.put("subjectName", material.getSubjectName());
        dto.put("scope", material.getScope());
        dto.put("scopeValue", material.getScopeValue());
        dto.put("scopeLabel", material.getScopeLabel());
        dto.put("userId", material.getOwner().getId());
        dto.put("savedInMyStudy", material.isSavedInMyStudy());
        dto.put("createdAt", material.getCreatedAt());

        if (material.getContentType() == AiContentType.QUIZ) {
            dto.put("lastScore", material.getLastScore());
        }

        if (share != null) {
            dto.put("shareId", String.valueOf(share.getId()));
            dto.put("isSharedWithMe", true);
            dto.put("sharedBy", share.getSender().getUsername());
            dto.put("shareNote", share.getNote() == null ? "" : share.getNote());
            dto.put("sharedAt", share.getSharedAt());
        }

        try {
            Map<String, Object> bodyMap = objectMapper.readValue(material.getContentJson(), MAP_TYPE);
            dto.putAll(bodyMap);
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo leer el contenido guardado del material IA.", ex);
        }
        return dto;
    }

    private AiMaterial findMaterialOrThrow(String rawId, String notFoundMessage) {
        Long id;
        try {
            id = Long.parseLong(rawId);
        } catch (NumberFormatException ex) {
            throw new AuthException(HttpStatus.NOT_FOUND, "MATERIAL_NOT_FOUND", notFoundMessage);
        }
        return aiMaterialRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "MATERIAL_NOT_FOUND", notFoundMessage));
    }

    private AiShare resolveReadableShare(AiMaterial material, User user, String forbiddenMessage) {
        if (material.getOwner().getId().equals(user.getId())) {
            return null;
        }
        return aiShareRepository.findByMaterialIdAndRecipientId(material.getId(), user.getId())
                .orElseThrow(() -> new AuthException(HttpStatus.FORBIDDEN, "FORBIDDEN", forbiddenMessage));
    }

    private void requireOwner(AiMaterial material, User user, String forbiddenMessage) {
        if (!material.getOwner().getId().equals(user.getId())) {
            throw new AuthException(HttpStatus.FORBIDDEN, "FORBIDDEN", forbiddenMessage);
        }
    }

    private User requireAuthenticated(User user, String message) {
        if (user == null) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", message);
        }
        return user;
    }

    private Long parseRequiredId(Object rawId, String errorMessage) {
        if (rawId == null) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", errorMessage);
        }
        try {
            return Long.parseLong(String.valueOf(rawId).trim());
        } catch (NumberFormatException ex) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", errorMessage);
        }
    }

    private Integer parseScore(Object rawScore) {
        if (rawScore == null) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "El puntaje del cuestionario es obligatorio.");
        }
        try {
            int score = Integer.parseInt(String.valueOf(rawScore).trim());
            if (score < 0 || score > 100) {
                throw new AuthException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "El puntaje debe estar entre 0 y 100.");
            }
            return score;
        } catch (NumberFormatException ex) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "El puntaje debe ser un número entero.");
        }
    }

    private List<String> extractTargetUsernames(Object rawTargets) {
        if (!(rawTargets instanceof Collection<?> list)) {
            return List.of();
        }
        Set<String> cleaned = new LinkedHashSet<>();
        for (Object item : list) {
            if (item == null) continue;
            String username = String.valueOf(item).trim().toLowerCase(Locale.ROOT);
            if (!username.isEmpty()) {
                cleaned.add(username);
            }
        }
        return List.copyOf(cleaned);
    }

    private String defaultTitlePrefix(AiContentType type) {
        return switch (type) {
            case QUIZ -> "Cuestionario IA";
            case SUMMARY -> "Resumen IA";
            case GUIDE -> "Guía de estudio IA";
            case SLIDES -> "Diapositivas IA";
        };
    }

    private String nonBlankOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private String truncate(String value, int maxLen) {
        if (value == null) return "";
        return value.length() <= maxLen ? value : value.substring(0, maxLen);
    }

    private record ScopeSpec(String scope, String scopeValue, String label) {}

    private record NormalizedPayload(String title, String contentJson) {}
}
