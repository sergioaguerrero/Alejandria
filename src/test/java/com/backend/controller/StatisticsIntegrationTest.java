package com.backend.controller;

import com.backend.cross.ReportReason;
import com.backend.cross.ResourceStatus;
import com.backend.cross.ResourceType;
import com.backend.domain.academy.Faculty;
import com.backend.domain.academy.Program;
import com.backend.domain.academy.Semester;
import com.backend.domain.academy.Subject;
import com.backend.domain.governance.Report;
import com.backend.domain.identity.Role;
import com.backend.domain.identity.User;
import com.backend.domain.repos.Resource;
import com.backend.domain.repos.StudyRepository;
import com.backend.service.JwtTokenService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Set;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class StatisticsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @Autowired
    private JwtTokenService jwtTokenService;

    private String adminToken;
    private String studentToken;
    private String readerToken;
    private Long repositoryId;
    private Long documentId;

    @BeforeEach
    void setUp() {
        cleanAllTables();
        SeedData seed = transactionTemplate.execute(status -> {
            Role studentRole = resolveRole("ESTUDIANTE", Set.of("READ", "UPLOAD"));
            Role adminRole = resolveRole("ADMINISTRADOR", Set.of("READ", "UPLOAD", "MODERATE"));

            User admin = new User(
                    "adminstats", "Admin", null, "Alejandria", "UPC",
                    "admin.stats@unicesar.edu.co", "hash", true, LocalDateTime.now()
            );
            admin.setRole(adminRole);
            entityManager.persist(admin);

            User student = new User(
                    "sergiostats", "Sergio", null, "Guerrero", "Daza",
                    "sergio.stats@unicesar.edu.co", "hash", true, LocalDateTime.now()
            );
            student.setSemester(5);
            student.setRole(studentRole);
            entityManager.persist(student);

            User reader = new User(
                    "laurastats", "Laura", null, "Martinez", "Rojas",
                    "laura.stats@unicesar.edu.co", "hash", true, LocalDateTime.now()
            );
            reader.setSemester(4);
            reader.setRole(studentRole);
            entityManager.persist(reader);

            Faculty faculty = new Faculty("Facultad de Ingenierías y Tecnológicas");
            entityManager.persist(faculty);

            Program program = new Program("Ingeniería de Sistemas", faculty);
            entityManager.persist(program);

            Semester sem4 = new Semester(4, program);
            entityManager.persist(sem4);

            Subject subject = new Subject("SS462", "Programación de Computadores III", 3, sem4);
            entityManager.persist(subject);

            StudyRepository repo = new StudyRepository(
                    "Repositorio Estadísticas P3",
                    "Repositorio para pruebas estadísticas",
                    subject,
                    student
            );
            entityManager.persist(repo);

            byte[] bytes = "%PDF-1.4\n".getBytes(StandardCharsets.UTF_8);
            Resource doc = new Resource(
                    "Guía Completa de Grafos",
                    "Documento académico de grafos para estadísticas",
                    ResourceType.GUIDE,
                    bytes,
                    MediaType.APPLICATION_PDF_VALUE,
                    bytes.length,
                    student,
                    subject
            );
            doc.setStudyRepository(repo);
            doc.setTerm(1);
            doc.setTopic("Grafos");
            doc.setFileName("grafos.pdf");
            doc.setStatus(ResourceStatus.PUBLISHED);
            entityManager.persist(doc);

            Report report = new Report(ReportReason.PLAGIARISM, "Posible duplicado", reader, doc);
            entityManager.persist(report);

            entityManager.flush();
            return new SeedData(admin, student, reader, repo.getId(), doc.getId());
        });

        adminToken = jwtTokenService.generateToken(seed.admin());
        studentToken = jwtTokenService.generateToken(seed.student());
        readerToken = jwtTokenService.generateToken(seed.reader());
        repositoryId = seed.repositoryId();
        documentId = seed.documentId();
    }

    @AfterEach
    void tearDown() {
        cleanAllTables();
    }

    @Test
    void personalAndGlobalAdminStatisticsReflectLiveActivity() throws Exception {
        // 1. Actividad real: like en repositorio, búsqueda, vista y descarga de documento
        mockMvc.perform(post("/api/repositories/{id}/like", repositoryId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + readerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/documents")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + readerToken)
                        .param("q", "grafos"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/documents/{id}", documentId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + readerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/documents/{id}/download", documentId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + readerToken))
                .andExpect(status().isOk());

        // 2. Mis estadísticas: sin token -> 401; dueño y lector -> 200 con métricas reales
        mockMvc.perform(get("/api/users/me/statistics"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/users/me/statistics")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken)
                        .param("period", "week"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totals.documentsUploaded").value(1))
                .andExpect(jsonPath("$.totals.views").value(1))
                .andExpect(jsonPath("$.totals.downloads").value(1))
                .andExpect(jsonPath("$.totals.likes").value(1))
                .andExpect(jsonPath("$.activity", hasSize(7)))
                .andExpect(jsonPath("$.myDocuments", hasSize(1)));

        mockMvc.perform(get("/api/users/me/statistics")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + readerToken)
                        .param("period", "month"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activity", hasSize(4)))
                .andExpect(jsonPath("$.topSubjects[0].subject").value("Programación de Computadores III"))
                .andExpect(jsonPath("$.recentHistory", hasSize(1)))
                .andExpect(jsonPath("$.recentHistory[0].title").value("Guía Completa de Grafos"));

        // 3. Estadísticas globales admin: estudiante -> 403; admin -> 200
        mockMvc.perform(get("/api/admin/statistics")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/statistics")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totals.activeStudents").value(2))
                .andExpect(jsonPath("$.totals.repositories").value(1))
                .andExpect(jsonPath("$.totals.documents").value(1))
                .andExpect(jsonPath("$.totals.totalReports").value(1))
                .andExpect(jsonPath("$.totals.pendingReports").value(1))
                .andExpect(jsonPath("$.topSubjects[0].subject").value("Programación de Computadores III"))
                .andExpect(jsonPath("$.topTopics[0].tema").value("Grafos"))
                .andExpect(jsonPath("$.topDocuments", hasSize(1)))
                .andExpect(jsonPath("$.reasonsSummary", hasSize(5)));

        // 4. Analítica avanzada admin (day / week / month)
        mockMvc.perform(get("/api/admin/statistics/advanced")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/statistics/advanced")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .param("period", "week"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.period").value("week"))
                .andExpect(jsonPath("$.activeUsers.totalActive").value(1))
                .andExpect(jsonPath("$.activeUsers.totalStudents").value(2))
                .andExpect(jsonPath("$.activeUsers.timeline", hasSize(7)))
                .andExpect(jsonPath("$.topSearchTerms[0].term").value("grafos"))
                .andExpect(jsonPath("$.topSearchTerms[0].count").value(1))
                .andExpect(jsonPath("$.aiUsage.byType", hasSize(4)));

        // 5. Endpoints de analítica protegidos: sin token -> 401; estudiante -> 403; admin -> 200
        String fromIso = LocalDateTime.now().minusDays(1).toString();
        String toIso = LocalDateTime.now().plusDays(1).toString();
        mockMvc.perform(get("/api/analytics/export")
                        .param("from", fromIso)
                        .param("to", toIso))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/analytics/export")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken)
                        .param("from", fromIso)
                        .param("to", toIso))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/analytics/export")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .param("from", fromIso)
                        .param("to", toIso))
                .andExpect(status().isOk());
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

    private record SeedData(User admin, User student, User reader, Long repositoryId, Long documentId) {}
}
