package com.backend.controller;

import com.backend.domain.identity.User;
import com.backend.dto.CollaboratorDto;
import com.backend.dto.InviteCollaboratorRequest;
import com.backend.dto.RepositoryPageResponse;
import com.backend.dto.RepositoryRequestDto;
import com.backend.dto.RepositoryResponseDto;
import com.backend.dto.RespondCollaboratorRequest;
import com.backend.service.CollaboratorService;
import com.backend.service.StudyRepositoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    public StudyRepositoryController(
            StudyRepositoryService studyRepositoryService,
            CollaboratorService collaboratorService
    ) {
        this.studyRepositoryService = studyRepositoryService;
        this.collaboratorService = collaboratorService;
    }

    @PostMapping("/repositories")
    public ResponseEntity<RepositoryResponseDto> createRepository(
            @Valid @RequestBody RepositoryRequestDto dto,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studyRepositoryService.create(dto, currentUser));
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
            @AuthenticationPrincipal User viewer
    ) {
        String effectiveSearch = (search != null && !search.isBlank()) ? search : q;
        RepositoryPageResponse response = studyRepositoryService.getAll(
                subjectId,
                semester,
                effectiveSearch,
                order,
                page,
                size,
                viewer
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/repositories/followed")
    public ResponseEntity<List<RepositoryResponseDto>> getFollowedRepositories(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(studyRepositoryService.getFollowed(currentUser));
    }

    @GetMapping("/repositories/{id}")
    public ResponseEntity<RepositoryResponseDto> getRepositoryById(
            @PathVariable Long id,
            @AuthenticationPrincipal User viewer
    ) {
        return ResponseEntity.ok(studyRepositoryService.getById(id, viewer));
    }

    @PutMapping("/repositories/{id}")
    public ResponseEntity<RepositoryResponseDto> updateRepository(
            @PathVariable Long id,
            @Valid @RequestBody RepositoryRequestDto dto,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(studyRepositoryService.update(id, dto, currentUser));
    }

    @DeleteMapping("/repositories/{id}")
    public ResponseEntity<Void> deleteRepository(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        studyRepositoryService.delete(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/repositories/{id}/like")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(studyRepositoryService.toggleLike(id, currentUser));
    }

    @PostMapping("/repositories/{id}/follow")
    public ResponseEntity<Map<String, Object>> toggleFollow(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(studyRepositoryService.toggleFollow(id, currentUser));
    }

    @GetMapping("/users/{username}/repositories")
    public ResponseEntity<List<RepositoryResponseDto>> getRepositoriesByUser(
            @PathVariable String username,
            @AuthenticationPrincipal User viewer
    ) {
        return ResponseEntity.ok(studyRepositoryService.getByAuthorUsername(username, viewer));
    }

    @GetMapping("/repositories/{id}/collaborators")
    public ResponseEntity<List<CollaboratorDto>> listRepositoryCollaborators(
            @PathVariable Long id,
            @AuthenticationPrincipal User viewer
    ) {
        return ResponseEntity.ok(collaboratorService.listByRepository(id, viewer));
    }

    @PostMapping("/repositories/{id}/collaborators")
    public ResponseEntity<CollaboratorDto> inviteCollaborator(
            @PathVariable Long id,
            @RequestBody InviteCollaboratorRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(collaboratorService.invite(id, request.getUsername(), currentUser));
    }

    @PostMapping("/repositories/{id}/collaborators/respond")
    public ResponseEntity<Map<String, String>> respondCollaboratorInvitation(
            @PathVariable Long id,
            @RequestBody RespondCollaboratorRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(collaboratorService.respond(id, request.isAccept(), currentUser));
    }

    @DeleteMapping("/repositories/{id}/collaborators/{username}")
    public ResponseEntity<Void> removeCollaborator(
            @PathVariable Long id,
            @PathVariable String username,
            @AuthenticationPrincipal User currentUser
    ) {
        collaboratorService.remove(id, username, currentUser);
        return ResponseEntity.noContent().build();
    }
}
