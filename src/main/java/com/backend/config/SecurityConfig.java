package com.backend.config;

import com.backend.exception.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            CorsConfigurationSource corsConfigurationSource,
            ObjectMapper objectMapper,
            @Value("${cors.allowed.origins:http://localhost:5173}") String allowedOrigins
    ) throws Exception {
        StringBuilder frameAncestors = new StringBuilder("frame-ancestors 'self' http://localhost:* http://127.0.0.1:*");
        if (allowedOrigins != null) {
            for (String origin : allowedOrigins.split(",")) {
                String clean = origin.trim();
                if (!clean.isEmpty()) {
                    frameAncestors.append(' ').append(clean);
                }
            }
        }

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> headers
                        .frameOptions(HeadersConfigurer.FrameOptionsConfig::disable)
                        .contentSecurityPolicy(csp -> csp.policyDirectives(frameAncestors.toString()))
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) ->
                                writeErrorResponse(
                                        response,
                                        objectMapper,
                                        HttpStatus.UNAUTHORIZED,
                                        "UNAUTHORIZED",
                                        "Debes iniciar sesión para continuar."
                                ))
                        .accessDeniedHandler((request, response, accessDeniedException) ->
                                writeErrorResponse(
                                        response,
                                        objectMapper,
                                        HttpStatus.FORBIDDEN,
                                        "FORBIDDEN",
                                        "No tienes permisos para acceder a este recurso."
                                ))
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/subjects/**", "/api/catalog/subjects/**").permitAll()
                        .requestMatchers("/api/repositories/followed").authenticated()
                        .requestMatchers(HttpMethod.GET,
                                "/api/repositories",
                                "/api/repositories/*",
                                "/api/repositories/*/documents",
                                "/api/repositories/*/collaborators",
                                "/api/users/*/repositories"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/api/documents",
                                "/api/documents/*",
                                "/api/documents/*/preview",
                                "/api/documents/*/download",
                                "/api/users/*/documents"
                        ).permitAll()
                        .requestMatchers("/api/users/me", "/api/users/me/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/users", "/api/users/*").permitAll()
                        .requestMatchers("/api/admin/**", "/api/analytics/top-subjects", "/api/analytics/export")
                        .hasRole("ADMIN")
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().denyAll()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${cors.allowed.origins:http://localhost:5173}") String allowedOrigins
    ) {
        Set<String> originPatterns = new LinkedHashSet<>();
        if (allowedOrigins != null) {
            for (String origin : allowedOrigins.split(",")) {
                String clean = origin.trim();
                if (!clean.isEmpty()) {
                    originPatterns.add(clean);
                }
            }
        }
        originPatterns.add("http://localhost:*");
        originPatterns.add("http://127.0.0.1:*");

        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(new ArrayList<>(originPatterns));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of(HttpHeaders.CONTENT_DISPOSITION));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private void writeErrorResponse(
            HttpServletResponse response,
            ObjectMapper objectMapper,
            HttpStatus status,
            String code,
            String message
    ) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        ErrorResponse body = new ErrorResponse(
                status.value(),
                status.getReasonPhrase(),
                message,
                code,
                null,
                null
        );
        objectMapper.writeValue(response.getWriter(), body);
    }
}
