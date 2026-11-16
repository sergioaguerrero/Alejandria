package com.backend.controller;

import com.backend.domain.academy.Faculty;
import com.backend.domain.academy.Program;
import com.backend.domain.academy.Semester;
import com.backend.domain.academy.Subject;
import com.backend.domain.identity.Role;
import com.backend.domain.identity.User;
import com.backend.domain.repos.StudyRepository;
import com.backend.service.JwtTokenService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Set;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DocumentControllerIntegrationTest {

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

    private String ownerToken;
    private String otherToken;
    private Long repositoryId;
    private Long subjectId;

    @BeforeEach
    void setUp() {
        SeedData seed = transactionTemplate.execute(status -> {
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

            Role studentRole = entityManager.createQuery(
                            "SELECT r FROM Role r WHERE r.name = 'ESTUDIANTE'", Role.class)
                    .getResultStream()
                    .findFirst()
                    .orElseGet(() -> {
                        Role role = new Role("ESTUDIANTE", Set.of("READ", "UPLOAD"));
                        entityManager.persist(role);
                        return role;
                    });

            User owner = new User(
                    "sergiotest", "Sergio", null, "Guerrero", "Daza",
                    "sergio@unicesar.edu.co", "hash", true, LocalDateTime.now()
            );
            owner.setRole(studentRole);
            entityManager.persist(owner);

            User other = new User(
                    "lauratest", "Laura", null, "Martinez", "Rojas",
                    "laura@unicesar.edu.co", "hash", true, LocalDateTime.now()
            );
            other.setRole(studentRole);
            entityManager.persist(other);

            Faculty faculty = new Faculty("Facultad de Ingenierías y Tecnológicas");
            entityManager.persist(faculty);

            Program program = new Program("Ingeniería de Sistemas", faculty);
            entityManager.persist(program);

            Semester sem4 = new Semester(4, program);
            entityManager.persist(sem4);

            Subject subject = new Subject("SS462", "Programación de Computadores III", 3, sem4);
            entityManager.persist(subject);

            StudyRepository repo = new StudyRepository(
                    "Programación de Computadores III",
                    "Repositorio dedicado a la Asignatura de P3",
                    subject,
                    owner
            );
            entityManager.persist(repo);
            entityManager.flush();

            return new SeedData(owner, other, repo.getId(), subject.getId());
        });

        ownerToken = jwtTokenService.generateToken(seed.owner());
        otherToken = jwtTokenService.generateToken(seed.other());
        repositoryId = seed.repositoryId();
        subjectId = seed.subjectId();
    }

    @Test
    void fullUploadSearchDetailPreviewDownloadUpdateAndDeleteLifecycle() throws Exception {
        byte[] pdfBytes = "%PDF-1.4\n1 0 obj\n<<>>\nendobj\n".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file",
                "taller-p3.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                pdfBytes
        );

        // 1. Sin token -> 401
        mockMvc.perform(multipart("/api/repositories/{id}/documents", repositoryId)
                        .file(pdfFile)
                        .param("title", "Taller de Grafos")
                        .param("description", "Solución completa del taller de grafos")
                        .param("type", "guia")
                        .param("term", "1")
                        .param("topic", "Grafos")
                        .param("tags", "[\"taller\",\"grafos\"]"))
                .andExpect(status().isUnauthorized());

        // 2. Otro usuario -> 403
        mockMvc.perform(multipart("/api/repositories/{id}/documents", repositoryId)
                        .file(pdfFile)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherToken)
                        .param("title", "Taller de Grafos")
                        .param("description", "Solución completa del taller de grafos")
                        .param("type", "guia")
                        .param("term", "1")
                        .param("topic", "Grafos")
                        .param("tags", "[\"taller\",\"grafos\"]"))
                .andExpect(status().isForbidden());

        // 3. Archivo inválido (.exe) -> 400 con fields.file
        MockMultipartFile exeFile = new MockMultipartFile(
                "file",
                "virus.exe",
                "application/x-msdownload",
                new byte[]{1, 2, 3}
        );
        mockMvc.perform(multipart("/api/repositories/{id}/documents", repositoryId)
                        .file(exeFile)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .param("title", "Archivo inválido")
                        .param("description", "Descripción suficientemente larga")
                        .param("type", "apunte")
                        .param("term", "2")
                        .param("topic", "Pruebas"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.file").exists());

        // 3b. Tema literal "Otro" rechazado -> 400 con fields.topic
        mockMvc.perform(multipart("/api/repositories/{id}/documents", repositoryId)
                        .file(pdfFile)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .param("title", "Taller personalizado")
                        .param("description", "Descripción suficientemente larga")
                        .param("type", "apunte")
                        .param("term", "2")
                        .param("topic", "Otro"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.topic").exists());

        // 4. Subida válida por el dueño -> 201
        MvcResult uploadResult = mockMvc.perform(multipart("/api/repositories/{id}/documents", repositoryId)
                        .file(pdfFile)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .param("title", "Taller de Grafos")
                        .param("description", "Solución completa del taller de grafos")
                        .param("type", "guia")
                        .param("term", "1")
                        .param("topic", "Grafos")
                        .param("tags", "[\"taller\",\"grafos\"]"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Taller de Grafos"))
                .andExpect(jsonPath("$.type").value("guia"))
                .andExpect(jsonPath("$.term").value(1))
                .andExpect(jsonPath("$.topic").value("Grafos"))
                .andExpect(jsonPath("$.tags", hasSize(2)))
                .andExpect(jsonPath("$.file.name").value("taller-p3.pdf"))
                .andExpect(jsonPath("$.file.extension").value("pdf"))
                .andExpect(jsonPath("$.authorUsername").value("sergiotest"))
                .andExpect(jsonPath("$.repository.id").value(String.valueOf(repositoryId)))
                .andExpect(jsonPath("$.subject.id").value(subjectId))
                .andReturn();

        JsonNode createdJson = objectMapper.readTree(uploadResult.getResponse().getContentAsString());
        String docId = createdJson.get("id").asText();

        // 5. Listado por repositorio (con y sin term) y por búsqueda global (incluyendo tags)
        mockMvc.perform(get("/api/repositories/{id}/documents", repositoryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(docId));

        mockMvc.perform(get("/api/repositories/{id}/documents", repositoryId)
                        .param("term", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(docId));

        mockMvc.perform(get("/api/documents")
                        .param("q", "grafos")
                        .param("subjectId", String.valueOf(subjectId))
                        .param("type", "guia"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].id").value(docId));

        mockMvc.perform(get("/api/documents")
                        .param("q", "taller"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].id").value(docId));

        // 6. Detalle incrementa vistas, preview inline y download incrementa descargas
        mockMvc.perform(get("/api/documents/{id}", docId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.views").value(1))
                .andExpect(jsonPath("$.downloads").value(0));

        mockMvc.perform(get("/api/documents/{id}/preview", docId))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("inline")))
                .andExpect(content().bytes(pdfBytes));

        mockMvc.perform(get("/api/documents/{id}/download", docId))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("attachment")))
                .andExpect(content().bytes(pdfBytes));

        mockMvc.perform(get("/api/documents/{id}", docId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.views").value(2))
                .andExpect(jsonPath("$.downloads").value(1));

        // 7. Edición sin archivo nuevo (PUT multipart)
        mockMvc.perform(multipart("/api/documents/{id}", docId)
                        .with(req -> {
                            req.setMethod("PUT");
                            return req;
                        })
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .param("title", "Taller de Grafos Actualizado")
                        .param("description", "Descripción actualizada del taller de grafos")
                        .param("type", "resumen")
                        .param("term", "2")
                        .param("topic", "  programación   dinámica  ")
                        .param("tags", "[\"repaso\"]"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Taller de Grafos Actualizado"))
                .andExpect(jsonPath("$.type").value("resumen"))
                .andExpect(jsonPath("$.term").value(2))
                .andExpect(jsonPath("$.topic").value("Programación dinámica"))
                .andExpect(jsonPath("$.tags", hasSize(1)));

        // 8. Eliminación (solo autor)
        mockMvc.perform(delete("/api/documents/{id}", docId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/documents/{id}", docId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/documents/{id}", docId))
                .andExpect(status().isNotFound());
    }

    private record SeedData(User owner, User other, Long repositoryId, Long subjectId) {}
}
