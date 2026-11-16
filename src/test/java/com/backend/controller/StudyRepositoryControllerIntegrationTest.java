package com.backend.controller;

import com.backend.domain.academy.Faculty;
import com.backend.domain.academy.Program;
import com.backend.domain.academy.Semester;
import com.backend.domain.academy.Subject;
import com.backend.domain.identity.Role;
import com.backend.domain.identity.User;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class StudyRepositoryControllerIntegrationTest {

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
    private Long subjectId;

    @BeforeEach
    void setUp() {
        SeedData seed = transactionTemplate.execute(status -> {
            entityManager.createQuery("DELETE FROM RepositoryFollow").executeUpdate();
            entityManager.createQuery("DELETE FROM RepositoryLike").executeUpdate();
            entityManager.createQuery("DELETE FROM Resource").executeUpdate();
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
            entityManager.flush();

            return new SeedData(owner, other, subject.getId());
        });

        ownerToken = jwtTokenService.generateToken(seed.owner());
        otherToken = jwtTokenService.generateToken(seed.other());
        subjectId = seed.subjectId();
    }

    @Test
    void rejectsUnauthenticatedCreateAndAllowsAuthenticatedLifecycle() throws Exception {
        String payload = objectMapper.writeValueAsString(Map.of(
                "name", "Programación de Computadores III",
                "description", "Repositorio dedicado a la Asignatura de P3",
                "subjectId", subjectId
        ));

        mockMvc.perform(post("/api/repositories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnauthorized());

        MvcResult createResult = mockMvc.perform(post("/api/repositories")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Programación de Computadores III"))
                .andExpect(jsonPath("$.subject.id").value(subjectId))
                .andExpect(jsonPath("$.subject.name").value("Programación de Computadores III"))
                .andExpect(jsonPath("$.subject.semester").value(4))
                .andExpect(jsonPath("$.authorUsername").value("sergiotest"))
                .andExpect(jsonPath("$.canUpload").value(true))
                .andReturn();

        JsonNode createdJson = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String repoId = createdJson.get("id").asText();

        mockMvc.perform(get("/api/repositories")
                        .param("subjectId", String.valueOf(subjectId))
                        .param("q", "P3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].id").value(repoId));

        mockMvc.perform(get("/api/repositories/{id}", repoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.canUpload").value(false));

        mockMvc.perform(get("/api/repositories/{id}/documents", repoId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        mockMvc.perform(get("/api/repositories/{id}/collaborators", repoId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        // Reacciones persistidas
        mockMvc.perform(post("/api/repositories/{id}/like", repoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked").value(true))
                .andExpect(jsonPath("$.likes").value(1));

        mockMvc.perform(post("/api/repositories/{id}/follow", repoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.followed").value(true))
                .andExpect(jsonPath("$.followersCount").value(1));

        mockMvc.perform(get("/api/repositories/followed")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(repoId));

        // Solo el dueño puede editar o eliminar
        String updatePayload = objectMapper.writeValueAsString(Map.of(
                "name", "P3 - Grupo 01",
                "description", "Repositorio actualizado con talleres y apuntes",
                "subjectId", subjectId
        ));

        mockMvc.perform(put("/api/repositories/{id}", repoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/repositories/{id}", repoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("P3 - Grupo 01"));

        mockMvc.perform(delete("/api/repositories/{id}", repoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/repositories/{id}", repoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/repositories/{id}", repoId))
                .andExpect(status().isNotFound());
    }

    private record SeedData(User owner, User other, Long subjectId) {}
}
