package com.backend.service;

import com.backend.cross.AiContentType;
import com.backend.domain.repos.Resource;
import com.backend.domain.repos.StudyRepository;
import com.backend.domain.repos.Tag;
import com.backend.exception.AuthException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Cliente HTTP hacia Google Gemini para generar materiales académicos estructurados en JSON.
 */
@Component
public class GeminiAiClient implements AiGenerationClient {

    private static final int MAX_DOCS_IN_PROMPT = 6;
    private static final int MAX_INLINE_PDFS = 3;
    private static final int MAX_PDF_BYTES = 4_000_000;
    private static final int MAX_TOTAL_PDF_BYTES = 8_000_000;
    private static final int MAX_TEXT_SNIPPET_CHARS = 8_000;
    private static final Set<String> TEXT_EXTENSIONS = Set.of(
            ".txt", ".md", ".csv", ".json", ".sql", ".java", ".py", ".js", ".jsx", ".ts", ".tsx", ".xml", ".html"
    );

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String apiUrl;
    private final String apiKey;

    public GeminiAiClient(
            RestTemplate restTemplate,
            ObjectMapper objectMapper,
            @Value("${ai.api.url}") String apiUrl,
            @Value("${ai.api.key:}") String apiKey
    ) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.apiUrl = apiUrl == null ? "" : apiUrl.trim();
        this.apiKey = apiKey == null ? "" : apiKey.trim();
    }

    @Override
    public JsonNode generateStructuredContent(
            AiContentType contentType,
            StudyRepository repository,
            List<Resource> documents,
            String scopeLabel
    ) {
        if (apiKey.isBlank()) {
            throw new AuthException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "AI_NOT_CONFIGURED",
                    "La API de Inteligencia Artificial aún no está configurada (falta ai.api.key en el backend)."
            );
        }

        String requestBody = buildRequestJson(contentType, repository, documents, scopeLabel);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> request = new HttpEntity<>(requestBody, headers);

        String rawResponse;
        try {
            rawResponse = restTemplate.postForObject(buildTargetUrl(), request, String.class);
        } catch (ResourceAccessException ex) {
            throw new AuthException(
                    HttpStatus.GATEWAY_TIMEOUT,
                    "AI_TIMEOUT",
                    "La generación con IA superó el tiempo máximo de espera. Intenta con un alcance más específico."
            );
        } catch (HttpStatusCodeException ex) {
            throw mapHttpError(ex);
        } catch (Exception ex) {
            throw new AuthException(
                    HttpStatus.BAD_GATEWAY,
                    "AI_PROVIDER_ERROR",
                    "Error de comunicación con el proveedor de IA."
            );
        }

        return extractStructuredJson(rawResponse);
    }

    private String buildTargetUrl() {
        String encodedKey = URLEncoder.encode(apiKey, StandardCharsets.UTF_8);
        if (apiUrl.endsWith("=")) {
            return apiUrl + encodedKey;
        }
        String separator = apiUrl.contains("?") ? "&" : "?";
        return apiUrl + separator + "key=" + encodedKey;
    }

    private AuthException mapHttpError(HttpStatusCodeException ex) {
        int status = ex.getStatusCode().value();
        if (status == 401 || status == 403) {
            return new AuthException(
                    HttpStatus.BAD_GATEWAY,
                    "AI_AUTH_ERROR",
                    "La clave de API de IA es inválida o no tiene permisos."
            );
        }
        if (status == 429) {
            return new AuthException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "AI_PROVIDER_RATE_LIMIT",
                    "El proveedor de IA alcanzó temporalmente su límite de solicitudes. Intenta en unos segundos."
            );
        }
        return new AuthException(
                HttpStatus.BAD_GATEWAY,
                "AI_PROVIDER_ERROR",
                "El proveedor de IA respondió con error (" + status + ")."
        );
    }

    private String buildRequestJson(
            AiContentType contentType,
            StudyRepository repository,
            List<Resource> documents,
            String scopeLabel
    ) {
        ObjectNode root = objectMapper.createObjectNode();

        ObjectNode systemInstruction = root.putObject("systemInstruction");
        systemInstruction.putArray("parts").addObject().put(
                "text",
                "Eres un tutor académico universitario experto de la Universidad Popular del Cesar (Alejandría UPC). " +
                "Responde SIEMPRE en español claro, riguroso y pedagógico, usando exclusivamente JSON válido " +
                "que respete exactamente el esquema solicitado. No inventes datos fuera del contexto dado ni uses markdown."
        );

        ArrayNode contents = root.putArray("contents");
        ObjectNode userContent = contents.addObject();
        userContent.put("role", "user");
        ArrayNode parts = userContent.putArray("parts");

        parts.addObject().put("text", buildUserPrompt(contentType, repository, documents, scopeLabel));
        attachDocumentFiles(parts, documents);

        ObjectNode generationConfig = root.putObject("generationConfig");
        generationConfig.put("temperature", 0.4);
        generationConfig.put("responseMimeType", "application/json");
        generationConfig.set("responseSchema", buildResponseSchema(contentType));

        try {
            return objectMapper.writeValueAsString(root);
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo serializar el prompt de IA.", ex);
        }
    }

    private String buildUserPrompt(
            AiContentType contentType,
            StudyRepository repository,
            List<Resource> documents,
            String scopeLabel
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("Genera ").append(describeTargetFormat(contentType)).append(" en español.\n\n");
        sb.append("Repositorio: ").append(repository.getName()).append("\n");
        sb.append("Asignatura: ").append(repository.getSubject() != null ? repository.getSubject().getName() : "General").append("\n");
        if (repository.getDescription() != null && !repository.getDescription().isBlank()) {
            sb.append("Descripción del repositorio: ").append(repository.getDescription()).append("\n");
        }
        sb.append("Alcance seleccionado: ").append(scopeLabel).append("\n\n");
        sb.append("Documentos de referencia:\n");

        int count = Math.min(MAX_DOCS_IN_PROMPT, documents.size());
        for (int i = 0; i < count; i++) {
            Resource doc = documents.get(i);
            sb.append(i + 1).append(". Título: ").append(doc.getTitle())
                    .append(" | Tipo: ").append(doc.getType())
                    .append(" | Corte: ").append(doc.getTerm());
            if (doc.getTopic() != null && !doc.getTopic().isBlank()) {
                sb.append(" | Tema: ").append(doc.getTopic());
            }
            if (doc.getTags() != null && !doc.getTags().isEmpty()) {
                String tagNames = doc.getTags().stream().map(Tag::getName).collect(Collectors.joining(", "));
                sb.append(" | Etiquetas: ").append(tagNames);
            }
            sb.append("\n");
            if (doc.getDescription() != null && !doc.getDescription().isBlank()) {
                sb.append("   Descripción: ").append(doc.getDescription()).append("\n");
            }
            String textSnippet = extractTextSnippet(doc);
            if (textSnippet != null && !textSnippet.isBlank()) {
                sb.append("   Extracto de contenido:\n").append(textSnippet).append("\n");
            }
        }
        return sb.toString();
    }

    private void attachDocumentFiles(ArrayNode parts, List<Resource> documents) {
        int pdfCount = 0;
        int totalBytes = 0;
        int limit = Math.min(MAX_DOCS_IN_PROMPT, documents.size());

        for (int i = 0; i < limit && pdfCount < MAX_INLINE_PDFS; i++) {
            Resource doc = documents.get(i);
            byte[] bytes = doc.getFileBytes();
            String mime = doc.getMimeType() == null ? "" : doc.getMimeType().toLowerCase(Locale.ROOT);
            if (bytes == null || bytes.length == 0 || bytes.length > MAX_PDF_BYTES) {
                continue;
            }
            if (totalBytes + bytes.length > MAX_TOTAL_PDF_BYTES) {
                continue;
            }
            boolean isSupportedBinary = "application/pdf".equals(mime) || mime.startsWith("image/");
            if (!isSupportedBinary) {
                continue;
            }
            ObjectNode inline = parts.addObject().putObject("inlineData");
            inline.put("mimeType", mime);
            inline.put("data", Base64.getEncoder().encodeToString(bytes));
            pdfCount++;
            totalBytes += bytes.length;
        }
    }

    private String extractTextSnippet(Resource doc) {
        byte[] bytes = doc.getFileBytes();
        if (bytes == null || bytes.length == 0) {
            return null;
        }
        String mime = doc.getMimeType() == null ? "" : doc.getMimeType().toLowerCase(Locale.ROOT);
        String fileName = doc.getFileName() == null ? "" : doc.getFileName().toLowerCase(Locale.ROOT);
        boolean isText = mime.startsWith("text/")
                || mime.contains("json")
                || mime.contains("xml")
                || TEXT_EXTENSIONS.stream().anyMatch(fileName::endsWith);
        if (!isText) {
            return null;
        }
        String decoded = new String(bytes, 0, Math.min(bytes.length, MAX_TEXT_SNIPPET_CHARS), StandardCharsets.UTF_8);
        return decoded.replace("\u0000", "").trim();
    }

    private String describeTargetFormat(AiContentType contentType) {
        return switch (contentType) {
            case QUIZ -> "un cuestionario de exactamente 5 preguntas de selección múltiple (4 opciones cada una, " +
                    "indicando correctIndex entre 0 y 3 y una explicación académica por pregunta)";
            case SUMMARY -> "un resumen académico estructurado con estimatedReadMinutes, overview, 3 secciones " +
                    "(heading, body, keyPoints) y un glosario keyConcepts de 3 conceptos (term, definition)";
            case GUIDE -> "una guía de estudio paso a paso con introduction, 3 objectives, 3 modules " +
                    "(title, summary, keyTakeaways, practicePrompt) y un checklist de 3 puntos";
            case SLIDES -> "una presentación de 5 diapositivas con subtitle y slides " +
                    "(slideNumber del 1 al 5, title, subtitle, 3 bulletPoints, takeaway y speakerNotes)";
        };
    }

    private ObjectNode buildResponseSchema(AiContentType contentType) {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "OBJECT");
        ObjectNode props = schema.putObject("properties");
        props.putObject("title").put("type", "STRING");

        switch (contentType) {
            case QUIZ -> {
                ObjectNode questions = props.putObject("questions");
                questions.put("type", "ARRAY");
                ObjectNode qItem = questions.putObject("items");
                qItem.put("type", "OBJECT");
                ObjectNode qProps = qItem.putObject("properties");
                qProps.putObject("id").put("type", "INTEGER");
                qProps.putObject("question").put("type", "STRING");
                ObjectNode opts = qProps.putObject("options");
                opts.put("type", "ARRAY");
                opts.putObject("items").put("type", "STRING");
                qProps.putObject("correctIndex").put("type", "INTEGER");
                qProps.putObject("explanation").put("type", "STRING");
                putRequired(qItem, "id", "question", "options", "correctIndex", "explanation");
                putRequired(schema, "title", "questions");
            }
            case SUMMARY -> {
                props.putObject("estimatedReadMinutes").put("type", "INTEGER");
                props.putObject("overview").put("type", "STRING");
                ObjectNode sections = props.putObject("sections");
                sections.put("type", "ARRAY");
                ObjectNode secItem = sections.putObject("items");
                secItem.put("type", "OBJECT");
                ObjectNode secProps = secItem.putObject("properties");
                secProps.putObject("heading").put("type", "STRING");
                secProps.putObject("body").put("type", "STRING");
                ObjectNode kp = secProps.putObject("keyPoints");
                kp.put("type", "ARRAY");
                kp.putObject("items").put("type", "STRING");
                putRequired(secItem, "heading", "body", "keyPoints");

                ObjectNode concepts = props.putObject("keyConcepts");
                concepts.put("type", "ARRAY");
                ObjectNode cItem = concepts.putObject("items");
                cItem.put("type", "OBJECT");
                ObjectNode cProps = cItem.putObject("properties");
                cProps.putObject("term").put("type", "STRING");
                cProps.putObject("definition").put("type", "STRING");
                putRequired(cItem, "term", "definition");
                putRequired(schema, "title", "estimatedReadMinutes", "overview", "sections", "keyConcepts");
            }
            case GUIDE -> {
                props.putObject("introduction").put("type", "STRING");
                ObjectNode objectives = props.putObject("objectives");
                objectives.put("type", "ARRAY");
                objectives.putObject("items").put("type", "STRING");

                ObjectNode modules = props.putObject("modules");
                modules.put("type", "ARRAY");
                ObjectNode modItem = modules.putObject("items");
                modItem.put("type", "OBJECT");
                ObjectNode modProps = modItem.putObject("properties");
                modProps.putObject("title").put("type", "STRING");
                modProps.putObject("summary").put("type", "STRING");
                ObjectNode kt = modProps.putObject("keyTakeaways");
                kt.put("type", "ARRAY");
                kt.putObject("items").put("type", "STRING");
                modProps.putObject("practicePrompt").put("type", "STRING");
                putRequired(modItem, "title", "summary", "keyTakeaways", "practicePrompt");

                ObjectNode checklist = props.putObject("checklist");
                checklist.put("type", "ARRAY");
                checklist.putObject("items").put("type", "STRING");
                putRequired(schema, "title", "introduction", "objectives", "modules", "checklist");
            }
            case SLIDES -> {
                props.putObject("subtitle").put("type", "STRING");
                ObjectNode slides = props.putObject("slides");
                slides.put("type", "ARRAY");
                ObjectNode sItem = slides.putObject("items");
                sItem.put("type", "OBJECT");
                ObjectNode sProps = sItem.putObject("properties");
                sProps.putObject("slideNumber").put("type", "INTEGER");
                sProps.putObject("title").put("type", "STRING");
                sProps.putObject("subtitle").put("type", "STRING");
                ObjectNode bp = sProps.putObject("bulletPoints");
                bp.put("type", "ARRAY");
                bp.putObject("items").put("type", "STRING");
                sProps.putObject("takeaway").put("type", "STRING");
                sProps.putObject("speakerNotes").put("type", "STRING");
                putRequired(sItem, "slideNumber", "title", "subtitle", "bulletPoints", "takeaway", "speakerNotes");
                putRequired(schema, "title", "subtitle", "slides");
            }
        }
        return schema;
    }

    private void putRequired(ObjectNode node, String... fields) {
        ArrayNode req = node.putArray("required");
        for (String field : fields) {
            req.add(field);
        }
    }

    private JsonNode extractStructuredJson(String rawResponse) {
        if (rawResponse == null || rawResponse.isBlank()) {
            throw new AuthException(HttpStatus.BAD_GATEWAY, "AI_EMPTY_RESPONSE", "El proveedor de IA devolvió una respuesta vacía.");
        }
        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                throw new AuthException(HttpStatus.BAD_GATEWAY, "AI_EMPTY_RESPONSE", "La IA no generó resultados para estos documentos.");
            }
            JsonNode parts = candidates.get(0).path("content").path("parts");
            String text = null;
            if (parts.isArray()) {
                for (JsonNode part : parts) {
                    if (!part.path("thought").asBoolean(false) && part.hasNonNull("text")) {
                        text = part.get("text").asText();
                    }
                }
            }
            if (text == null || text.isBlank()) {
                throw new AuthException(HttpStatus.BAD_GATEWAY, "AI_EMPTY_RESPONSE", "La respuesta de la IA no contenía JSON válido.");
            }
            String cleaned = stripMarkdownFences(text);
            return objectMapper.readTree(cleaned);
        } catch (AuthException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new AuthException(HttpStatus.BAD_GATEWAY, "AI_INVALID_JSON", "No se pudo interpretar el formato JSON generado por la IA.");
        }
    }

    private String stripMarkdownFences(String raw) {
        String trimmed = raw.trim();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            if (firstNewline >= 0) {
                trimmed = trimmed.substring(firstNewline + 1);
            }
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.length() - 3);
            }
        }
        return trimmed.trim();
    }
}
