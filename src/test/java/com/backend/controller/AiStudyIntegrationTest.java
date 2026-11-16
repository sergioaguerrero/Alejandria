package com.backend.controller;

import com.backend.cross.AiContentType;
import com.backend.cross.ResourceType;
import com.backend.domain.academy.Faculty;
import com.backend.domain.academy.Program;
import com.backend.domain.academy.Semester;
import com.backend.domain.academy.Subject;
import com.backend.domain.identity.Role;
import com.backend.domain.identity.User;
import com.backend.domain.identity.UserFollow;
import com.backend.domain.repos.Resource;
import com.backend.domain.repos.StudyRepository;
import com.backend.service.AiGenerationClient;
import com.backend.service.JwtTokenService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AiStudyIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @Autowired
    private JwtTokenService jwtTokenService;

    @MockitoBean
    private AiGenerationClient aiGenerationClient;

    private String ownerToken;
    private String friendToken;
    private String strangerToken;
    private String adminToken;
    private Long repositoryId;

    @BeforeEach
    void setUp() throws Exception {
        cleanAllTables();

        JsonNode quizNode = objectMapper.readTree("""
                {
                  "title": "Cuestionario IA: Redes",
                  "questions": [
                    {
                      "id": 1,
                      "question": "¿En qué capa del modelo OSI opera IP?",
                      "options": ["Red", "Enlace", "Transporte", "Aplicación"],
                      "correctIndex": 0,
                      "explanation": "IP opera en la capa 3 (Red)."
                    }
                  ]
                }
                """);
        JsonNode summaryNode = objectMapper.readTree("""
                {
                  "title": "Resumen IA: Redes",
                  "estimatedReadMinutes": 4,
                  "overview": "Síntesis de TCP/IP y enrutamiento.",
                  "sections": [{ "heading": "Modelo OSI", "body": "Capas.", "keyPoints": ["Capa 3", "Capa 4"] }],
                  "keyConcepts": [{ "term": "TCP", "definition": "Protocolo orientado a conexión." }]
                }
                """);
        JsonNode guideNode = objectMapper.readTree("""
                {
                  "title": "Guía IA: Redes",
                  "introduction": "Plan de repaso para parcial.",
                  "objectives": ["Dominar subneteo"],
                  "modules": [{ "title": "Módulo 1", "summary": "IPv4", "keyTakeaways": ["CIDR"], "practicePrompt": "Calcula /26" }],
                  "checklist": ["Practiqué CIDR"]
                }
                """);
        JsonNode slidesNode = objectMapper.readTree("""
                {
                  "title": "Diapositivas IA: Redes",
                  "subtitle": "Presentación de repaso",
                  "slides": [{
                    "slideNumber": 1,
                    "title": "Introducción",
                    "subtitle": "Protocolos",
                    "bulletPoints": ["TCP vs UDP"],
                    "takeaway": "Cada capa tiene una responsabilidad.",
                    "speakerNotes": "Explicar handshake."
                  }]
                }
                """);

        when(aiGenerationClient.generateStructuredContent(any(), any(), anyList(), anyString()))
                .thenAnswer(inv -> switch ((AiContentType) inv.getArgument(0)) {
                    case QUIZ -> quizNode;
                    case SUMMARY -> summaryNode;
                    case GUIDE -> guideNode;
                    case SLIDES -> slidesNode;
                });

        SeedData seed = transactionTemplate.execute(status -> {
            Role studentRole = resolveRole("ESTUDIANTE", Set.of("READ", "UPLOAD"));
            Role adminRole = resolveRole("ADMINISTRADOR", Set.of("READ", "UPLOAD", "MODERATE"));

            User owner = new User("ownerai", "Ana", null, "Perez", "Diaz",
                    "ana.ai@unicesar.edu.co", "hash", true, LocalDateTime.now());
            owner.setRole(studentRole);
            entityManager.persist(owner);

            User friend = new User("friendai", "Luis", null, "Rojas", "Mora",
                    "luis.ai@unicesar.edu.co", "hash", true, LocalDateTime.now());
            friend.setRole(studentRole);
            entityManager.persist(friend);

            User stranger = new User("strangerai", "Sofia", null, "Castro", "Vega",
                    "sofia.ai@unicesar.edu.co", "hash", true, LocalDateTime.now());
            stranger.setRole(studentRole);
            entityManager.persist(stranger);

            User admin = new User("adminai", "Admin", null, "UPC", "Root",
                    "admin.ai@unicesar.edu.co", "hash", true, LocalDateTime.now());
            admin.setRole(adminRole);
            entityManager.persist(admin);

            // Amistad mutua solo entre owner y friend; stranger solo sigue sin reciprocidad
            entityManager.persist(new UserFollow(owner.getId(), friend.getId()));
            entityManager.persist(new UserFollow(friend.getId(), owner.getId()));
            entityManager.persist(new UserFollow(owner.getId(), stranger.getId()));

            Faculty faculty = new Faculty("Ingeniería");
            entityManager.persist(faculty);
            Program program = new Program("Ingeniería de Sistemas", faculty);
            entityManager.persist(program);
            Semester semester = new Semester(5, program);
            entityManager.persist(semester);
            Subject subject = new Subject("SS502", "Redes de Computadores", 3, semester);
            entityManager.persist(subject);

            StudyRepository repo = new StudyRepository("Repo Redes", "Material de redes y TCP/IP", subject, owner);
            entityManager.persist(repo);

            byte[] bytes = "Apuntes de capa de red y transporte TCP/UDP.".getBytes(StandardCharsets.UTF_8);
            Resource doc = new Resource(
                    "Apuntes TCP/IP", "Resumen de protocolos", ResourceType.NOTE,
                    bytes, "text/plain", bytes.length, owner, subject
            );
            doc.setStudyRepository(repo);
            doc.setTerm(1);
            doc.setTopic("TCP/IP");
            doc.setFileName("redes.txt");
            entityManager.persist(doc);

            entityManager.flush();
            return new SeedData(owner, friend, stranger, admin, repo.getId());
        });

        ownerToken = jwtTokenService.generateToken(seed.owner());
        friendToken = jwtTokenService.generateToken(seed.friend());
        strangerToken = jwtTokenService.generateToken(seed.stranger());
        adminToken = jwtTokenService.generateToken(seed.admin());
        repositoryId = seed.repositoryId();
    }

    @AfterEach
    void tearDown() {
        cleanAllTables();
    }

    @Test
    void fullAiStudyLifecycleQuotaSharingAndAdminMetricsWork() throws Exception {
        mockMvc.perform(get("/api/ai/quota")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(5))
                .andExpect(jsonPath("$.used").value(0))
                .andExpect(jsonPath("$.remaining").value(5));

        // 1. Generar Quiz (1/5)
        MvcResult quizResult = mockMvc.perform(post("/api/ai/quiz")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "repositoryId", String.valueOf(repositoryId),
                                "scope", "topic",
                                "scopeValue", "TCP/IP"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contentType").value("quiz"))
                .andExpect(jsonPath("$.questions[0].question").value("¿En qué capa del modelo OSI opera IP?"))
                .andReturn();
        String quizId = objectMapper.readTree(quizResult.getResponse().getContentAsString()).get("id").asText();

        // Responder y guardar en Mi estudio
        mockMvc.perform(post("/api/ai/quiz/{id}/submit", quizId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"score\": 100}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lastScore").value(100));

        mockMvc.perform(post("/api/ai/quiz/{id}/save", quizId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"save\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.savedInMyStudy").value(true));

        // 2, 3, 4. Generar summary, guide y slides
        MvcResult summaryResult = mockMvc.perform(post("/api/ai/materials")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "contentType", "summary",
                                "repositoryId", String.valueOf(repositoryId),
                                "scope", "all"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contentType").value("summary"))
                .andExpect(jsonPath("$.sections[0].heading").value("Modelo OSI"))
                .andReturn();
        String summaryId = objectMapper.readTree(summaryResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(post("/api/ai/materials/{id}/save", summaryId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"save\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.savedInMyStudy").value(true));

        mockMvc.perform(post("/api/ai/materials")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "contentType", "guide",
                                "repositoryId", String.valueOf(repositoryId),
                                "scope", "term",
                                "scopeValue", 1
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contentType").value("guide"))
                .andExpect(jsonPath("$.modules[0].title").value("Módulo 1"));

        mockMvc.perform(post("/api/ai/materials")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "contentType", "slides",
                                "repositoryId", String.valueOf(repositoryId),
                                "scope", "all"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contentType").value("slides"))
                .andExpect(jsonPath("$.slides[0].slideNumber").value(1));

        // Mi estudio contiene quiz y summary
        mockMvc.perform(get("/api/ai/my-study")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        // Quitar summary de Mi estudio mantiene cuota intacta
        mockMvc.perform(delete("/api/ai/my-study/{id}", summaryId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Compartir con no-amigo falla 403
        mockMvc.perform(post("/api/ai/materials/{id}/share", quizId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "friendUsernames", List.of("strangerai"),
                                "note", "Repasa esto"
                        ))))
                .andExpect(status().isForbidden());

        // Compartir con amigo mutuo funciona y crea notificación + acceso
        mockMvc.perform(post("/api/ai/materials/{id}/share", quizId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "friendUsernames", List.of("friendai"),
                                "note", "Suerte en el parcial"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sharedCount").value(1));

        mockMvc.perform(get("/api/ai/materials/{id}/shares", quizId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value("friendai"));

        mockMvc.perform(get("/api/ai/shared-with-me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + friendToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sharedBy").value("ownerai"))
                .andExpect(jsonPath("$[0].shareNote").value("Suerte en el parcial"));

        mockMvc.perform(get("/api/ai/quiz/{id}", quizId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + friendToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isSharedWithMe").value(true));

        mockMvc.perform(get("/api/ai/quiz/{id}", quizId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + strangerToken))
                .andExpect(status().isForbidden());

        // 5ta generación consume cuota y 6ta devuelve 429
        mockMvc.perform(post("/api/ai/quiz")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "repositoryId", String.valueOf(repositoryId),
                                "scope", "all"
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/ai/quota")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.used").value(5))
                .andExpect(jsonPath("$.remaining").value(0));

        mockMvc.perform(post("/api/ai/quiz")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "repositoryId", String.valueOf(repositoryId),
                                "scope", "all"
                        ))))
                .andExpect(status().isTooManyRequests());

        // Estadísticas avanzadas admin reflejan las 5 generaciones y 1 compartido
        mockMvc.perform(get("/api/admin/statistics/advanced")
                        .param("period", "week")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.aiUsage.periodGenerations").value(5))
                .andExpect(jsonPath("$.aiUsage.totalGenerations").value(5))
                .andExpect(jsonPath("$.aiUsage.sharedWithFriends").value(1))
                .andExpect(jsonPath("$.aiUsage.topRepositories[0].repositoryName").value("Repo Redes"));
    }

    private Role resolveRole(String name, Set<String> permissions) {
        return entityManager.createQuery("SELECT r FROM Role r WHERE r.name = :name", Role.class)
                .setParameter("name", name)
                .getResultStream()
                .findFirst()
                .orElseGet(() -> {
                    Role role = new Role(name, permissions);
                    entityManager.persist(role);
                    return role;
                });
    }

    private void cleanAllTables() {
        transactionTemplate.executeWithoutResult(status -> {
            entityManager.createQuery("DELETE FROM AiShare").executeUpdate();
            entityManager.createQuery("DELETE FROM AiMaterial").executeUpdate();
            entityManager.createQuery("DELETE FROM Interaction").executeUpdate();
            entityManager.createQuery("DELETE FROM DemandMetric").executeUpdate();
            entityManager.createQuery("DELETE FROM UserSanction").executeUpdate();
            entityManager.createQuery("DELETE FROM Decision").executeUpdate();
            entityManager.createQuery("DELETE FROM Report").executeUpdate();
            entityManager.createQuery("DELETE FROM Notification").executeUpdate();
            entityManager.createQuery("DELETE FROM RepositoryCollaborator").executeUpdate();
            entityManager.createQuery("DELETE FROM UserSubjectInterest").executeUpdate();
            entityManager.createQuery("DELETE FROM UserFollow").executeUpdate();
            entityManager.createQuery("DELETE FROM PasswordResetToken").executeUpdate();
            entityManager.createQuery("DELETE FROM RepositoryFollow").executeUpdate();
            entityManager.createQuery("DELETE FROM RepositoryLike").executeUpdate();
            entityManager.createQuery("DELETE FROM Resource").executeUpdate();
            entityManager.createQuery("DELETE FROM Tag").executeUpdate();
            entityManager.createQuery("DELETE FROM StudyRepository").executeUpdate();
            entityManager.createQuery("DELETE FROM EmailVerificationCode").executeUpdate();
            entityManager.createQuery("DELETE FROM User").executeUpdate();
            entityManager.createQuery("DELETE FROM Subject").executeUpdate();
            entityManager.createQuery("DELETE FROM Semester").executeUpdate();
            entityManager.createQuery("DELETE FROM Program").executeUpdate();
            entityManager.createQuery("DELETE FROM Faculty").executeUpdate();
        });
    }

    private record SeedData(User owner, User friend, User stranger, User admin, Long repositoryId) {}
}
