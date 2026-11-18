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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class UserProfileIntegrationTest {

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

    private String sergioToken;
    private String lauraToken;
    private Long subject1Id;
    private Long subject2Id;

    @BeforeEach
    void setUp() {
        SeedData seed = transactionTemplate.execute(status -> {
            entityManager.createQuery("DELETE FROM UserSubjectInterest").executeUpdate();
            entityManager.createQuery("DELETE FROM UserContact").executeUpdate();
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

            String initialHash = passwordEncoder.encode("Secret123");
            User sergio = new User(
                    "sergioprofile", "Sergio", null, "Guerrero", "Daza",
                    "sergio.profile@unicesar.edu.co", initialHash, true, LocalDateTime.now()
            );
            sergio.setSemester(4);
            sergio.setRole(studentRole);
            entityManager.persist(sergio);

            User laura = new User(
                    "lauraprofile", "Laura", null, "Martinez", "Rojas",
                    "laura.profile@unicesar.edu.co", initialHash, true, LocalDateTime.now()
            );
            laura.setSemester(6);
            laura.setRole(studentRole);
            entityManager.persist(laura);

            Faculty faculty = new Faculty("Facultad de Ingenierías y Tecnológicas");
            entityManager.persist(faculty);

            Program program = new Program("Ingeniería de Sistemas", faculty);
            entityManager.persist(program);

            Semester sem4 = new Semester(4, program);
            entityManager.persist(sem4);

            Subject s1 = new Subject("SS462", "Programación de Computadores III", 3, sem4);
            Subject s2 = new Subject("SS463", "Bases de Datos I", 3, sem4);
            entityManager.persist(s1);
            entityManager.persist(s2);
            entityManager.flush();

            return new SeedData(sergio, laura, s1.getId(), s2.getId());
        });

        sergioToken = jwtTokenService.generateToken(seed.sergio());
        lauraToken = jwtTokenService.generateToken(seed.laura());
        subject1Id = seed.subject1Id();
        subject2Id = seed.subject2Id();
    }

    @Test
    void profileUpdatePasswordChangeAndRecoveryFlow() throws Exception {
        // 1. Edición sin token -> 401
        mockMvc.perform(put("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Nuevo Nombre",
                                "username", "nuevouser",
                                "semester", 5
                        ))))
                .andExpect(status().isUnauthorized());

        // 2. Edición con username duplicado -> 400 fields.username
        mockMvc.perform(put("/api/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sergioToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Sergio Guerrero",
                                "username", "lauraprofile",
                                "semester", 5
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.username").exists());

        // 3. Edición válida con nombre de 2 palabras, nuevo username y semestre -> 200
        mockMvc.perform(put("/api/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sergioToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Sergio Guerrero",
                                "username", "sergio_upc",
                                "semester", 5
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Sergio Guerrero"))
                .andExpect(jsonPath("$.username").value("sergio_upc"))
                .andExpect(jsonPath("$.semester").value(5));

        // 4. El mismo JWT sigue resolviendo el usuario actualizado y permite cambiar clave
        mockMvc.perform(put("/api/users/me/password")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sergioToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "currentPassword", "Wrong123",
                                "newPassword", "Updated123"
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.currentPassword").exists());

        mockMvc.perform(put("/api/users/me/password")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sergioToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "currentPassword", "Secret123",
                                "newPassword", "Updated123"
                        ))))
                .andExpect(status().isNoContent());

        // 5. Recuperación de contraseña y restablecimiento
        MvcResult recoverResult = mockMvc.perform(post("/api/auth/recover")
                        .header(HttpHeaders.ORIGIN, "http://localhost:5174")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "sergio.profile@unicesar.edu.co"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.testToken").isNotEmpty())
                .andReturn();

        JsonNode recoverJson = objectMapper.readTree(recoverResult.getResponse().getContentAsString());
        String resetToken = recoverJson.get("testToken").asText();

        // Correo no registrado devuelve respuesta neutra sin testToken
        mockMvc.perform(post("/api/auth/recover")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "noexiste@unicesar.edu.co"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.testToken").doesNotExist());

        // Restablecer clave con el token
        mockMvc.perform(post("/api/auth/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "token", resetToken,
                                "newPassword", "Recovered123"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Reutilizar token -> 400 TOKEN_EXPIRED
        mockMvc.perform(post("/api/auth/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "token", resetToken,
                                "newPassword", "Another123"
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("TOKEN_EXPIRED"));

        // Login con nueva contraseña -> 200
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "identifier", "sergio_upc",
                                "password", "Recovered123"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void publicProfileFollowFriendsSearchAndSubjectsFlow() throws Exception {
        // 1. Perfil público y búsqueda por username y semestre
        mockMvc.perform(get("/api/users/{username}", "lauraprofile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sergioToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("lauraprofile"))
                .andExpect(jsonPath("$.isSelf").value(false))
                .andExpect(jsonPath("$.isFollowing").value(false))
                .andExpect(jsonPath("$.isFriend").value(false));

        mockMvc.perform(get("/api/users")
                        .param("q", "semestre 6"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].username").value("lauraprofile"));

        // 2. Seguimiento mutuo -> amigos
        mockMvc.perform(post("/api/users/{username}/follow", "sergioprofile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sergioToken))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/users/{username}/follow", "lauraprofile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sergioToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isFollowing").value(true))
                .andExpect(jsonPath("$.followsMe").value(false))
                .andExpect(jsonPath("$.isFriend").value(false))
                .andExpect(jsonPath("$.followersCount").value(1));

        mockMvc.perform(post("/api/users/{username}/follow", "sergioprofile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + lauraToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isFollowing").value(true))
                .andExpect(jsonPath("$.followsMe").value(true))
                .andExpect(jsonPath("$.isFriend").value(true));

        mockMvc.perform(get("/api/users/me/friends")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sergioToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].username").value("lauraprofile"))
                .andExpect(jsonPath("$[0].isFriend").value(true));

        mockMvc.perform(get("/api/users/me/following")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sergioToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(get("/api/users/me/followers")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sergioToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        // 3. Materias de interés
        mockMvc.perform(get("/api/users/me/subjects")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sergioToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        mockMvc.perform(put("/api/users/me/subjects")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sergioToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "subjectIds", List.of(subject1Id, subject2Id)
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        mockMvc.perform(put("/api/users/me/subjects")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sergioToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "subjectIds", List.of(subject2Id)
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(subject2Id));

        mockMvc.perform(put("/api/users/me/subjects")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sergioToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "subjectIds", List.of(999999L)
                        ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void bioAndContactsUpdateValidationAndPublicVisibility() throws Exception {
        // 1. Validación: bio > 500 caracteres y contacto inválido -> 400 con errores por campo
        String overLimitBio = "a".repeat(501);
        mockMvc.perform(put("/api/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sergioToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Sergio Guerrero",
                                "username", "sergioprofile",
                                "semester", 4,
                                "bio", overLimitBio,
                                "contacts", List.of(
                                        Map.of("type", "EMAIL", "value", "correo-invalido", "label", "Personal"),
                                        Map.of("type", "WEBSITE", "value", "javascript:alert(1)", "label", "")
                                )
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.bio").exists())
                .andExpect(jsonPath("$.fields['contacts.0.value']").exists())
                .andExpect(jsonPath("$.fields['contacts.1.value']").exists());

        // 2. Actualización válida con descripción y medios de contacto
        mockMvc.perform(put("/api/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sergioToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Sergio Guerrero",
                                "username", "sergioprofile",
                                "semester", 4,
                                "bio", "  Estudiante de 4to semestre interesado en bases de datos y backend.  ",
                                "contacts", List.of(
                                        Map.of("type", "WHATSAPP", "value", "+57 300 123 4567", "label", "Estudio"),
                                        Map.of("type", "GITHUB", "value", "@sergioprofile", "label", ""),
                                        Map.of("type", "DISCORD", "value", "sergio.dev", "label", "Servidor UPC")
                                )
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bio").value("Estudiante de 4to semestre interesado en bases de datos y backend."))
                .andExpect(jsonPath("$.contacts", hasSize(3)))
                .andExpect(jsonPath("$.contacts[0].type").value("WHATSAPP"))
                .andExpect(jsonPath("$.contacts[0].value").value("+57 300 123 4567"))
                .andExpect(jsonPath("$.contacts[0].label").value("Estudio"))
                .andExpect(jsonPath("$.contacts[1].type").value("GITHUB"))
                .andExpect(jsonPath("$.contacts[2].type").value("DISCORD"));

        // 3. GET /api/users/me devuelve la misma información persistida
        mockMvc.perform(get("/api/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sergioToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bio").value("Estudiante de 4to semestre interesado en bases de datos y backend."))
                .andExpect(jsonPath("$.contacts", hasSize(3)));

        // 4. Perfil público expone bio y contactos sin exponer correo institucional ni nombre completo privado
        mockMvc.perform(get("/api/users/{username}", "sergioprofile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + lauraToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bio").value("Estudiante de 4to semestre interesado en bases de datos y backend."))
                .andExpect(jsonPath("$.contacts", hasSize(3)))
                .andExpect(jsonPath("$.contacts[0].type").value("WHATSAPP"))
                .andExpect(jsonPath("$.email").doesNotExist())
                .andExpect(jsonPath("$.name").doesNotExist());

        // 5. Reemplazo y limpieza de bio y contactos
        mockMvc.perform(put("/api/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sergioToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Sergio Guerrero",
                                "username", "sergioprofile",
                                "semester", 4,
                                "bio", "",
                                "contacts", List.of()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bio").doesNotExist())
                .andExpect(jsonPath("$.contacts", hasSize(0)));
    }

    private record SeedData(User sergio, User laura, Long subject1Id, Long subject2Id) {}
}
