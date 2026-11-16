package com.backend.controller;

import com.backend.domain.identity.User;
import com.backend.domain.repos.Resource;
import com.backend.dto.RepositoryPageResponse;
import com.backend.dto.RepositoryRequestDto;
import com.backend.dto.RepositoryResponseDto;
import com.backend.service.JwtTokenService;
import com.backend.service.StudyRepositoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Expone los endpoints REST para la gestión de repositorios de estudio.
 */
@RestController
@RequestMapping("/api")
public class StudyRepositoryController {

    private final StudyRepositoryService studyRepositoryService;
    private final JwtTokenService jwtTokenService;

    public StudyRepositoryController(
            StudyRepositoryService studyRepositoryService,
            JwtTokenService jwtTokenService
    ) {
        this.studyRepositoryService = studyRepositoryService;
        this.jwtTokenService = jwtTokenService;
    }

    @PostMapping("/repositories")
    public ResponseEntity<RepositoryResponseDto> createRepository(
            @Valid @RequestBody RepositoryRequestDto dto,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        User currentUser = resolveUser(authorization);
        RepositoryResponseDto created = studyRepositoryService.create(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/repositories")
    public ResponseEntity<RepositoryPageResponse> getRepositories(
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Integer semester,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "recent") String order,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        String effectiveSearch = (q != null && !q.isBlank()) ? q : search;
        RepositoryPageResponse response = studyRepositoryService.getAll(
                subjectId,
                semester,
                effectiveSearch,
                order,
                page,
                size,
                resolveUser(authorization)
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/repositories/followed")
    public ResponseEntity<List<RepositoryResponseDto>> getFollowedRepositories(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(studyRepositoryService.getFollowed(resolveUser(authorization)));
    }

    @GetMapping("/repositories/{id}")
    public ResponseEntity<RepositoryResponseDto> getRepositoryById(
            @PathVariable Long id,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(studyRepositoryService.getById(id, resolveUser(authorization)));
    }

    @PutMapping("/repositories/{id}")
    public ResponseEntity<RepositoryResponseDto> updateRepository(
            @PathVariable Long id,
            @Valid @RequestBody RepositoryRequestDto dto,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(studyRepositoryService.update(id, dto, resolveUser(authorization)));
    }

    @DeleteMapping("/repositories/{id}")
    public ResponseEntity<Void> deleteRepository(
            @PathVariable Long id,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        studyRepositoryService.delete(id, resolveUser(authorization));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/repositories/{id}/like")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable Long id,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(studyRepositoryService.toggleLike(id, resolveUser(authorization)));
    }

    @PostMapping("/repositories/{id}/follow")
    public ResponseEntity<Map<String, Object>> toggleFollow(
            @PathVariable Long id,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(studyRepositoryService.toggleFollow(id, resolveUser(authorization)));
    }

    @GetMapping("/users/{username}/repositories")
    public ResponseEntity<List<RepositoryResponseDto>> getRepositoriesByUser(
            @PathVariable String username,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(studyRepositoryService.getByAuthorUsername(username, resolveUser(authorization)));
    }

    @GetMapping("/repositories/{id}/documents")
    public ResponseEntity<List<RepositoryDocumentSummary>> listRepositoryDocuments(@PathVariable Long id) {
        List<RepositoryDocumentSummary> docs = studyRepositoryService.listDocuments(id).stream()
                .map(RepositoryDocumentSummary::fromResource)
                .toList();
        return ResponseEntity.ok(docs);
    }

    @GetMapping("/repositories/{id}/collaborators")
    public ResponseEntity<List<Object>> listRepositoryCollaborators(
            @PathVariable Long id,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        studyRepositoryService.getById(id, resolveUser(authorization));
        return ResponseEntity.ok(List.of());
    }

    private User resolveUser(String authorization) {
        return jwtTokenService.resolveUserFromAuthorizationHeader(authorization).orElse(null);
    }

    public record RepositoryDocumentSummary(
            String id,
            String title,
            String description,
            String type,
            String mimeType,
            long fileSizeBytes,
            LocalDateTime uploadDate,
            String status,
            int downloads
    ) {
        static RepositoryDocumentSummary fromResource(Resource resource) {
            return new RepositoryDocumentSummary(
                    String.valueOf(resource.getId()),
                    resource.getTitle(),
                    resource.getDescription(),
                    resource.getType() != null ? resource.getType().name() : null,
                    resource.getMimeType(),
                    resource.getFileSizeBytes(),
                    resource.getUploadDate(),
                    resource.getStatus() != null ? resource.getStatus().name() : null,
                    resource.getTotalDownloads()
            );
        }
    }
}
