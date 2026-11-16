package com.backend.controller;

import com.backend.domain.identity.User;
import com.backend.dto.CollaboratorDto;
import com.backend.dto.InviteCollaboratorRequest;
import com.backend.dto.RepositoryPageResponse;
import com.backend.dto.RepositoryRequestDto;
import com.backend.dto.RepositoryResponseDto;
import com.backend.dto.RespondCollaboratorRequest;
import com.backend.service.CollaboratorService;
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

import java.util.List;
import java.util.Map;

/**
 * Expone los endpoints REST para la gestión de repositorios de estudio y sus colaboradores.
 */
@RestController
@RequestMapping("/api")
public class StudyRepositoryController {

    private final StudyRepositoryService studyRepositoryService;
    private final CollaboratorService collaboratorService;
    private final JwtTokenService jwtTokenService;

    public StudyRepositoryController(
            StudyRepositoryService studyRepositoryService,
            CollaboratorService collaboratorService,
            JwtTokenService jwtTokenService
    ) {
        this.studyRepositoryService = studyRepositoryService;
        this.collaboratorService = collaboratorService;
        this.jwtTokenService = jwtTokenService;
    }

    @PostMapping("/repositories")
    public ResponseEntity<RepositoryResponseDto> createRepository(
            @Valid @RequestBody RepositoryRequestDto dto,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        User user = resolveUser(authorization);
        return ResponseEntity.status(HttpStatus.CREATED).body(studyRepositoryService.create(dto, user));
    }

    @GetMapping("/repositories")
    public ResponseEntity<RepositoryPageResponse> listRepositories(
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Integer semester,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "recent") String order,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "6") int size,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        String effectiveSearch = (search != null && !search.isBlank()) ? search : q;
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

    @GetMapping("/repositories/{id}/collaborators")
    public ResponseEntity<List<CollaboratorDto>> listRepositoryCollaborators(
            @PathVariable Long id,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(collaboratorService.listByRepository(id, resolveUser(authorization)));
    }

    @PostMapping("/repositories/{id}/collaborators")
    public ResponseEntity<CollaboratorDto> inviteCollaborator(
            @PathVariable Long id,
            @RequestBody InviteCollaboratorRequest request,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(collaboratorService.invite(id, request.getUsername(), resolveUser(authorization)));
    }

    @PostMapping("/repositories/{id}/collaborators/respond")
    public ResponseEntity<Map<String, String>> respondCollaboratorInvitation(
            @PathVariable Long id,
            @RequestBody RespondCollaboratorRequest request,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(collaboratorService.respond(id, request.isAccept(), resolveUser(authorization)));
    }

    @DeleteMapping("/repositories/{id}/collaborators/{username}")
    public ResponseEntity<Void> removeCollaborator(
            @PathVariable Long id,
            @PathVariable String username,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        collaboratorService.remove(id, username, resolveUser(authorization));
        return ResponseEntity.noContent().build();
    }

    private User resolveUser(String authorization) {
        return jwtTokenService.resolveUserFromAuthorizationHeader(authorization).orElse(null);
    }
}
