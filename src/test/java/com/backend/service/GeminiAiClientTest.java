package com.backend.service;

import com.backend.cross.AiContentType;
import com.backend.cross.ResourceType;
import com.backend.domain.academy.Faculty;
import com.backend.domain.academy.Program;
import com.backend.domain.academy.Semester;
import com.backend.domain.academy.Subject;
import com.backend.domain.identity.User;
import com.backend.domain.repos.Resource;
import com.backend.domain.repos.StudyRepository;
import com.backend.exception.AuthException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class GeminiAiClientTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void throwsServiceUnavailableWhenApiKeyMissing() {
        RestTemplate restTemplate = new RestTemplate();
        GeminiAiClient client = new GeminiAiClient(
                restTemplate,
                objectMapper,
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=",
                ""
        );

        StudyRepository repo = sampleRepository();
        Resource doc = sampleResource(repo);

        assertThatThrownBy(() -> client.generateStructuredContent(
                AiContentType.QUIZ, repo, List.of(doc), "Todo el repositorio"
        ))
                .isInstanceOf(AuthException.class)
                .satisfies(ex -> {
                    AuthException auth = (AuthException) ex;
                    assertThat(auth.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
                    assertThat(auth.getCode()).isEqualTo("AI_NOT_CONFIGURED");
                });
    }

    @Test
    void parsesGeminiJsonSkippingThoughtPartsAndMarkdownFences() {
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();

        String baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=";
        String geminiPayload = """
                {
                  "candidates": [{
                    "content": {
                      "parts": [
                        {"thought": true, "text": "razonamiento interno"},
                        {"text": "```json\\n{\\"title\\": \\"Cuestionario de Grafos\\", \\"questions\\": [{\\"id\\": 1, \\"question\\": \\"Que es BFS?\\", \\"options\\": [\\"Recorrido en anchura\\", \\"A\\", \\"B\\", \\"C\\"], \\"correctIndex\\": 0, \\"explanation\\": \\"Usa cola FIFO\\"}]}\\n```"}
                      ]
                    }
                  }]
                }
                """;
        server.expect(requestTo(baseUrl + "fake-key"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(geminiPayload, MediaType.APPLICATION_JSON));

        GeminiAiClient client = new GeminiAiClient(restTemplate, objectMapper, baseUrl, "fake-key");
        StudyRepository repo = sampleRepository();
        Resource doc = sampleResource(repo);

        JsonNode parsed = client.generateStructuredContent(
                AiContentType.QUIZ, repo, List.of(doc), "Todo el repositorio"
        );

        server.verify();
        assertThat(parsed.path("title").asText()).isEqualTo("Cuestionario de Grafos");
        assertThat(parsed.path("questions")).hasSize(1);
    }

    private StudyRepository sampleRepository() {
        Faculty faculty = new Faculty("Ingeniería");
        Program program = new Program("Sistemas", faculty);
        Semester semester = new Semester(4, program);
        Subject subject = new Subject("SS401", "Estructuras de Datos", 3, semester);
        User author = new User("author", "Ana", null, "Perez", "Gomez",
                "ana@unicesar.edu.co", "hash", true, LocalDateTime.now());
        return new StudyRepository("Repo Grafos", "Apuntes de clase", subject, author);
    }

    private Resource sampleResource(StudyRepository repo) {
        byte[] content = "BFS recorre por niveles usando una cola FIFO.".getBytes(StandardCharsets.UTF_8);
        Resource res = new Resource(
                "Apuntes BFS", "Resumen de grafos", ResourceType.NOTE,
                content, "text/plain", content.length, repo.getAuthor(), repo.getSubject()
        );
        res.setStudyRepository(repo);
        res.setFileName("bfs.txt");
        return res;
    }
}
