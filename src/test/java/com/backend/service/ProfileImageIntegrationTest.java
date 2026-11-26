package com.backend.service;

import com.backend.domain.identity.Role;
import com.backend.domain.identity.User;
import com.backend.repository.AuthUsuariosRepository;
import com.backend.repository.RoleRepository;
import com.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(ProfileImageIntegrationTest.H2AuthPackageStubConfig.class)
class ProfileImageIntegrationTest {

    @TestConfiguration
    static class H2AuthPackageStubConfig {
        @Bean
        @Primary
        AuthUsuariosRepository stubAuthUsuariosRepository(JdbcTemplate jdbcTemplate) {
            return new AuthUsuariosRepository(jdbcTemplate) {
                @Override
                public int usuarioPuedeAcceder(Long usuarioId) {
                    return 1;
                }

                @Override
                public List<Long> contactosUsuarioIds(Long usuarioId) {
                    return List.of();
                }
            };
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private JwtTokenService jwtTokenService;

    private String userToken;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM IMAGEN_PERFIL_USUARIO");
        jdbcTemplate.update("DELETE FROM CONTACTO_USUARIO");
        jdbcTemplate.update("DELETE FROM CODIGO_VERIFICACION_CORREO");
        userRepository.deleteAll();

        Role role = roleRepository.findByName("ESTUDIANTE")
                .orElseGet(() -> roleRepository.save(new Role("ESTUDIANTE", Set.of("READ", "UPLOAD"))));

        User user = new User(
                "fotouser",
                "Sergio",
                null,
                "Guerrero",
                "Daza",
                "foto.user@unicesar.edu.co",
                "hashed-password",
                true,
                LocalDateTime.now()
        );
        user.setSemester(5);
        user.setRole(role);
        User saved = userRepository.save(user);
        userToken = jwtTokenService.generateToken(saved);
    }

    @Test
    void fullAvatarAndBannerLifecycleWorksWithBlobStorageAndValidation() throws Exception {
        byte[] samplePng = new byte[]{
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52
        };
        byte[] sampleJpeg = new byte[]{
                (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0,
                0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01
        };
        byte[] sampleWebp = new byte[]{
                'R', 'I', 'F', 'F', 0x24, 0x00, 0x00, 0x00,
                'W', 'E', 'B', 'P', 'V', 'P', '8', ' '
        };
        byte[] invalidBytes = "<html>not-an-image</html>".getBytes();

        // 1. Sin token -> 401
        MockMultipartFile pngFile = new MockMultipartFile("file", "avatar.png", "image/png", samplePng);
        mockMvc.perform(multipart(HttpMethod.PUT, "/api/users/me/avatar").file(pngFile))
                .andExpect(status().isUnauthorized());

        // 2. Archivo con magic bytes inválidos -> 400
        MockMultipartFile fakeFile = new MockMultipartFile("file", "fake.png", "image/png", invalidBytes);
        mockMvc.perform(multipart(HttpMethod.PUT, "/api/users/me/avatar")
                        .file(fakeFile)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.file").exists());

        // 3. Subir avatar PNG -> 200 y URL versionada
        MvcResult avatarRes = mockMvc.perform(multipart(HttpMethod.PUT, "/api/users/me/avatar")
                        .file(pngFile)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarUrl", containsString("/avatar?v=")))
                .andExpect(jsonPath("$.bannerUrl").doesNotExist())
                .andReturn();

        String firstAvatarUrl = objectMapper.readTree(avatarRes.getResponse().getContentAsString())
                .get("avatarUrl").asText();

        // 4. GET público del avatar devuelve exactamente los bytes PNG y ETag válido
        MvcResult publicAvatarGet = mockMvc.perform(get(firstAvatarUrl))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andExpect(header().exists(HttpHeaders.ETAG))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("Cross-Origin-Resource-Policy", "cross-origin"))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, containsString("immutable")))
                .andExpect(content().bytes(samplePng))
                .andReturn();

        // 4b. Revalidación condicional con If-None-Match -> 304 Not Modified sin reenviar bytes
        String avatarEtag = publicAvatarGet.getResponse().getHeader(HttpHeaders.ETAG);
        mockMvc.perform(get(firstAvatarUrl).header(HttpHeaders.IF_NONE_MATCH, avatarEtag))
                .andExpect(status().isNotModified())
                .andExpect(content().bytes(new byte[0]));

        // 5. Subir banner WebP -> 200 y URL versionada
        MockMultipartFile webpBanner = new MockMultipartFile("file", "banner.webp", "image/webp", sampleWebp);
        MvcResult bannerRes = mockMvc.perform(multipart(HttpMethod.PUT, "/api/users/me/banner")
                        .file(webpBanner)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarUrl").value(firstAvatarUrl))
                .andExpect(jsonPath("$.bannerUrl", containsString("/banner?v=")))
                .andReturn();

        String bannerUrl = objectMapper.readTree(bannerRes.getResponse().getContentAsString())
                .get("bannerUrl").asText();

        mockMvc.perform(get(bannerUrl))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/webp"))
                .andExpect(content().bytes(sampleWebp));

        // 6. Reemplazar avatar con JPEG actualiza la versión (?v=...) y bytes
        MockMultipartFile jpegAvatar = new MockMultipartFile("file", "avatar.jpg", "image/jpeg", sampleJpeg);
        MvcResult replacedAvatarRes = mockMvc.perform(multipart(HttpMethod.PUT, "/api/users/me/avatar")
                        .file(jpegAvatar)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarUrl", not(firstAvatarUrl)))
                .andReturn();

        String secondAvatarUrl = objectMapper.readTree(replacedAvatarRes.getResponse().getContentAsString())
                .get("avatarUrl").asText();

        mockMvc.perform(get(secondAvatarUrl))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/jpeg"))
                .andExpect(content().bytes(sampleJpeg));

        // 7. GET /api/users/me devuelve ambas URLs actualizadas y contadores sociales
        mockMvc.perform(get("/api/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarUrl").value(secondAvatarUrl))
                .andExpect(jsonPath("$.bannerUrl").value(bannerUrl))
                .andExpect(jsonPath("$.followersCount").value(0))
                .andExpect(jsonPath("$.followingCount").value(0));

        // 7b. GET /api/health público responde 200 UP
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));

        // 8. Eliminar avatar y banner
        mockMvc.perform(delete("/api/users/me/avatar")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarUrl").doesNotExist())
                .andExpect(jsonPath("$.bannerUrl").value(bannerUrl));

        mockMvc.perform(get(secondAvatarUrl))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/users/me/banner")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bannerUrl").doesNotExist());

        mockMvc.perform(get(bannerUrl))
                .andExpect(status().isNotFound());
    }
}
