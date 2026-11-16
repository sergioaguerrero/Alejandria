package com.backend.controller;

import com.backend.cross.ResourceStatus;
import com.backend.cross.ResourceType;
import com.backend.domain.academy.Faculty;
import com.backend.domain.academy.Program;
import com.backend.domain.academy.Semester;
import com.backend.domain.academy.Subject;
import com.backend.domain.identity.Role;
import com.backend.domain.identity.User;
import com.backend.domain.repos.Resource;
import com.backend.domain.repos.StudyRepository;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ModerationAndAdminUsersIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenService jwtTokenService;

    private String adminToken;
    private String reporterToken;
    private String authorToken;
    private Long authorId;
    private Long repositoryId;
    private Long documentId;

    @BeforeEach
    void setUp() {
        cleanAllTables();
        SeedData seed = transactionTemplate.execute(status -> {
            Role studentRole = resolveRole("ESTUDIANTE", Set.of("READ", "UPLOAD"));
            Role adminRole = resolveRole("ADMINISTRADOR", Set.of("READ", "UPLOAD", "MODERATE"));

            String hash = passwordEncoder.encode("Secret123");

            User admin = new User(
                    "adminmod", "Admin", null, "Alejandria", "UPC",
                    "admin.mod@unicesar.edu.co", hash, true, LocalDateTime.now()
            );
            admin.setRole(adminRole);
            entityManager.persist(admin);

            User reporter = new User(
                    "reporterusr", "Carlos", null, "Diaz", "Lopez",
                    "carlos.mod@unicesar.edu.co", hash, true, LocalDateTime.now()
            );
            reporter.setSemester(4);
            reporter.setRole(studentRole);
            entityManager.persist(reporter);

            User author = new User(
                    "authorusr", "Juan", null, "Perez", "Gomez",
                    "juan.mod@unicesar.edu.co", hash, true, LocalDateTime.now()
            );
            author.setSemester(5);
            author.setRole(studentRole);
            entityManager.persist(author);

            Faculty faculty = new Faculty("Facultad de Ingenierías y Tecnológicas");
            entityManager.persist(faculty);

            Program program = new Program("Ingeniería de Sistemas", faculty);
            entityManager.persist(program);

            Semester sem4 = new Semester(4, program);
            entityManager.persist(sem4);

            Subject subject = new Subject("SS462", "Programación de Computadores III", 3, sem4);
            entityManager.persist(subject);

            StudyRepository repo = new StudyRepository(
                    "Repo Reportable P3",
                    "Repositorio de prueba para moderación",
                    subject,
                    author
            );
            entityManager.persist(repo);

            byte[] bytes = "%PDF-1.4\n".getBytes(StandardCharsets.UTF_8);
            Resource doc = new Resource(
                    "Parcial Filtrado",
                    "Documento reportado para moderación",
                    ResourceType.GUIDE,
                    bytes,
                    MediaType.APPLICATION_PDF_VALUE,
                    bytes.length,
                    author,
                    subject
            );
            doc.setStudyRepository(repo);
            doc.setTerm(1);
            doc.setTopic("Grafos");
            doc.setFileName("parcial.pdf");
            doc.setStatus(ResourceStatus.PUBLISHED);
            entityManager.persist(doc);
            entityManager.flush();

            return new SeedData(admin, reporter, author, repo.getId(), doc.getId());
        });

        adminToken = jwtTokenService.generateToken(seed.admin());
        reporterToken = jwtTokenService.generateToken(seed.reporter());
        authorToken = jwtTokenService.generateToken(seed.author());
        authorId = seed.author().getId();
        repositoryId = seed.repositoryId();
        documentId = seed.documentId();
    }

    @AfterEach
    void tearDown() {
        cleanAllTables();
    }

    @Test
    void fullModerationAndAdminUserSuspensionLifecycle() throws Exception {
        // 1. Reportar sin sesión -> 401; motivo inválido -> 400
        mockMvc.perform(post("/api/reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "targetType", "document",
                                "targetId", String.valueOf(documentId),
                                "reason", "examen-vigente",
                                "comment", "Examen en curso"
                        ))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/reports")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + reporterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "targetType", "document",
                                "targetId", String.valueOf(documentId),
                                "reason", "invalido"
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.reason").exists());

        // 2. Estudiante reporta documento -> 201 y duplicado pendiente -> 409
        MvcResult docReportRes = mockMvc.perform(post("/api/reports")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + reporterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "targetType", "document",
                                "targetId", String.valueOf(documentId),
                                "reason", "examen-vigente",
                                "comment", "Es un examen activo"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("pendiente"))
                .andExpect(jsonPath("$.targetType").value("document"))
                .andExpect(jsonPath("$.reason").value("examen-vigente"))
                .andReturn();

        JsonNode docReportJson = objectMapper.readTree(docReportRes.getResponse().getContentAsString());
        String docReportId = docReportJson.get("id").asText();

        mockMvc.perform(post("/api/reports")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + reporterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "targetType", "document",
                                "targetId", String.valueOf(documentId),
                                "reason", "plagio"
                        ))))
                .andExpect(status().isConflict());

        // Reportar repositorio y perfil también funciona
        MvcResult repoReportRes = mockMvc.perform(post("/api/reports")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + reporterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "targetType", "repository",
                                "targetId", String.valueOf(repositoryId),
                                "reason", "duplicado"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.targetType").value("repository"))
                .andReturn();
        String repoReportId = objectMapper.readTree(repoReportRes.getResponse().getContentAsString()).get("id").asText();

        MvcResult profileReportRes = mockMvc.perform(post("/api/reports")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + reporterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "targetType", "profile",
                                "targetId", "authorusr",
                                "reason", "inapropiado"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.targetType").value("profile"))
                .andReturn();
        String profileReportId = objectMapper.readTree(profileReportRes.getResponse().getContentAsString()).get("id").asText();

        // Admin recibió notificaciones report_pending
        mockMvc.perform(get("/api/notifications/unread-count")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(3));

        // 3. No-admin no puede entrar a bandeja admin ni gestión de usuarios -> 403
        mockMvc.perform(get("/api/admin/reports")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + reporterToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/users/{id}", authorId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + reporterToken))
                .andExpect(status().isForbidden());

        // 4. Admin lista y filtra bandeja, inspecciona detalle y oculta el documento
        mockMvc.perform(get("/api/admin/reports")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .param("status", "pendiente"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)));

        mockMvc.perform(get("/api/admin/reports/{id}", docReportId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.author.username").value("authorusr"))
                .andExpect(jsonPath("$.targetData.title").value("Parcial Filtrado"));

        mockMvc.perform(post("/api/admin/reports/{id}/resolve", docReportId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "action", "ocultado",
                                "note", "Se oculta mientras termina el examen"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("resuelto"))
                .andExpect(jsonPath("$.resolution").value("ocultado"));

        // El documento oculto ya no sale en listados ni en detalle público
        mockMvc.perform(get("/api/documents/{id}", documentId))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/repositories/{id}/documents", repositoryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        // 5. Admin envía advertencia sobre el repo y suspende al autor desde el reporte de perfil
        mockMvc.perform(post("/api/admin/reports/{id}/resolve", repoReportId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "action", "advertencia",
                                "note", "Primera advertencia"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resolution").value("advertencia"));

        mockMvc.perform(post("/api/admin/reports/{id}/resolve", profileReportId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "action", "suspension",
                                "note", "Incumplimiento reiterado"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resolution").value("suspension"));

        // Usuario suspendido: no puede hacer login (403 ACCOUNT_SUSPENDED) ni usar su JWT actual
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "identifier", "authorusr",
                                "password", "Secret123"
                        ))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCOUNT_SUSPENDED"));

        mockMvc.perform(get("/api/users/me/subjects")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + authorToken))
                .andExpect(status().isUnauthorized());

        // 6. Admin consulta usuario (con 2 sanciones) y reactiva la cuenta
        mockMvc.perform(get("/api/admin/users/{id}", authorId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("authorusr"))
                .andExpect(jsonPath("$.suspended").value(true))
                .andExpect(jsonPath("$.repositoriesCount").value(1))
                .andExpect(jsonPath("$.documentsCount").value(1))
                .andExpect(jsonPath("$.sanctions", hasSize(2)));

        mockMvc.perform(post("/api/admin/users/{id}/toggle-suspension", authorId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("reason", "Apelación aceptada"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.suspended").value(false));

        // Login vuelve a funcionar tras reactivación
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "identifier", "authorusr",
                                "password", "Secret123"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
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

    private record SeedData(User admin, User reporter, User author, Long repositoryId, Long documentId) {}
}
