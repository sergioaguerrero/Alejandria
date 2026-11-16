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
import java.util.Map;
import java.util.Set;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CollaboratorsAndNotificationsIntegrationTest {

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
    private String collabToken;
    private String followerToken;
    private Long repositoryId;

    @BeforeEach
    void setUp() {
        SeedData seed = transactionTemplate.execute(status -> {
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
                    "ownercollab", "Sergio", null, "Guerrero", "Daza",
                    "owner.collab@unicesar.edu.co", "hash", true, LocalDateTime.now()
            );
            owner.setSemester(5);
            owner.setRole(studentRole);
            entityManager.persist(owner);

            User collaborator = new User(
                    "lauracollab", "Laura", null, "Martinez", "Rojas",
                    "laura.collab@unicesar.edu.co", "hash", true, LocalDateTime.now()
            );
            collaborator.setSemester(5);
            collaborator.setRole(studentRole);
            entityManager.persist(collaborator);

            User follower = new User(
                    "carlosfollow", "Carlos", null, "Perez", "Gomez",
                    "carlos.follow@unicesar.edu.co", "hash", true, LocalDateTime.now()
            );
            follower.setSemester(4);
            follower.setRole(studentRole);
            entityManager.persist(follower);

            Faculty faculty = new Faculty("Facultad de Ingenierías y Tecnológicas");
            entityManager.persist(faculty);

            Program program = new Program("Ingeniería de Sistemas", faculty);
            entityManager.persist(program);

            Semester sem4 = new Semester(4, program);
            entityManager.persist(sem4);

            Subject subject = new Subject("SS462", "Programación de Computadores III", 3, sem4);
            entityManager.persist(subject);

            StudyRepository repo = new StudyRepository(
                    "Repositorio Colaborativo P3",
                    "Repositorio para probar colaboradores y notificaciones",
                    subject,
                    owner
            );
            entityManager.persist(repo);
            entityManager.flush();

            return new SeedData(owner, collaborator, follower, repo.getId());
        });

        ownerToken = jwtTokenService.generateToken(seed.owner());
        collabToken = jwtTokenService.generateToken(seed.collaborator());
        followerToken = jwtTokenService.generateToken(seed.follower());
        repositoryId = seed.repositoryId();
    }

    @Test
    void collaboratorsPermissionsAndNotificationsLifecycle() throws Exception {
        // 1. Seguimiento de repositorio y de usuario para probar notificaciones de nuevo contenido
        mockMvc.perform(post("/api/repositories/{id}/follow", repositoryId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + followerToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/repositories/{id}/like", repositoryId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + followerToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/users/{username}/follow", "lauracollab")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/users/{username}/follow", "ownercollab")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + collabToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isFriend").value(true));

        // 2. Solo el dueño puede invitar; colaborador invitado no es dueño
        mockMvc.perform(post("/api/repositories/{id}/collaborators", repositoryId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + collabToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("username", "carlosfollow"))))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/repositories/{id}/collaborators", repositoryId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("username", "lauracollab"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("lauracollab"))
                .andExpect(jsonPath("$.status").value("pendiente"))
                .andExpect(jsonPath("$.invitedBy").value("ownercollab"));

        // Invitación duplicada -> 409
        mockMvc.perform(post("/api/repositories/{id}/collaborators", repositoryId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("username", "lauracollab"))))
                .andExpect(status().isConflict());

        // 3. Visibilidad: dueño e invitada ven pendiente; tercero ve lista vacía; getMyCollaborations muestra invitación
        mockMvc.perform(get("/api/repositories/{id}/collaborators", repositoryId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(get("/api/repositories/{id}/collaborators", repositoryId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + followerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        mockMvc.perform(get("/api/users/me/collaborations")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + collabToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.invitations", hasSize(1)))
                .andExpect(jsonPath("$.invitations[0].repository.name").value("Repositorio Colaborativo P3"))
                .andExpect(jsonPath("$.collaboratedRepositories", hasSize(0)));

        mockMvc.perform(get("/api/repositories/{id}", repositoryId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + collabToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isCollaborator").value(false))
                .andExpect(jsonPath("$.collaboratorStatus").value("pendiente"))
                .andExpect(jsonPath("$.canUpload").value(false));

        // 4. Invitada acepta -> canUpload = true y aparece en collaboratedRepositories
        mockMvc.perform(post("/api/repositories/{id}/collaborators/respond", repositoryId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + collabToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("accept", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("aceptado"));

        mockMvc.perform(get("/api/repositories/{id}", repositoryId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + collabToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isCollaborator").value(true))
                .andExpect(jsonPath("$.collaboratorStatus").value("aceptado"))
                .andExpect(jsonPath("$.canUpload").value(true));

        mockMvc.perform(get("/api/users/me/collaborations")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + collabToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.invitations", hasSize(0)))
                .andExpect(jsonPath("$.collaboratedRepositories", hasSize(1)));

        // 5. Colaborador aceptado puede subir documento y genera notificación new_content a seguidores
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file",
                "guia-colab.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "%PDF-1.4\n".getBytes(StandardCharsets.UTF_8)
        );
        mockMvc.perform(multipart("/api/repositories/{id}/documents", repositoryId)
                        .file(pdfFile)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + collabToken)
                        .param("title", "Guía subida por colaboradora")
                        .param("description", "Documento colaborativo de prueba")
                        .param("type", "guia")
                        .param("term", "1")
                        .param("topic", "Árboles Binarios"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.authorUsername").value("lauracollab"));

        // El seguidor del repo recibió notificación new_content
        MvcResult followerNotifsResult = mockMvc.perform(get("/api/notifications")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + followerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].type").value("new_content"))
                .andExpect(jsonPath("$[0].read").value(false))
                .andReturn();

        JsonNode followerNotifs = objectMapper.readTree(followerNotifsResult.getResponse().getContentAsString());
        String notifId = followerNotifs.get(0).get("id").asText();

        mockMvc.perform(get("/api/notifications/unread-count")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + followerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(1));

        // Otro usuario no puede marcar como leída una notificación ajena -> 404
        mockMvc.perform(put("/api/notifications/{id}/read", notifId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isNotFound());

        // Marcar una como leída
        mockMvc.perform(put("/api/notifications/{id}/read", notifId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + followerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/notifications/unread-count")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + followerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0));

        // Dueño recibió: like + friend_match + collab_invite (aceptada) + new_content = 4 notificaciones
        mockMvc.perform(get("/api/notifications/unread-count")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(4));

        mockMvc.perform(put("/api/notifications/read-all")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/notifications/unread-count")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0));

        // 6. Salir o eliminar colaborador
        mockMvc.perform(delete("/api/repositories/{id}/collaborators/{username}", repositoryId, "lauracollab")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + collabToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/repositories/{id}", repositoryId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + collabToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isCollaborator").value(false))
                .andExpect(jsonPath("$.canUpload").value(false));
    }

    private record SeedData(User owner, User collaborator, User follower, Long repositoryId) {}
}
