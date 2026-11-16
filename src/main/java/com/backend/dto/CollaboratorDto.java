package com.backend.dto;

import com.backend.cross.CollaboratorStatus;
import com.backend.domain.identity.User;
import com.backend.domain.repos.RepositoryCollaborator;

import java.time.LocalDateTime;
import java.util.Locale;

/**
 * DTO de colaborador o invitación pendiente de un repositorio.
 */
public class CollaboratorDto {

    private String id;
    private String repositoryId;
    private String username;
    private String status;
    private String invitedBy;
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;
    private CollaboratorUserDto user;
    private RepositoryResponseDto repository;

    public static CollaboratorDto fromEntity(RepositoryCollaborator entity, RepositoryResponseDto repositoryDto) {
        CollaboratorDto dto = new CollaboratorDto();
        dto.setId(String.valueOf(entity.getId()));
        dto.setRepositoryId(entity.getStudyRepository() != null ? String.valueOf(entity.getStudyRepository().getId()) : null);
        User collabUser = entity.getUser();
        dto.setUsername(collabUser != null ? collabUser.getUsername() : null);
        dto.setStatus(toFrontendStatus(entity.getStatus()));
        dto.setInvitedBy(entity.getInvitedBy() != null ? entity.getInvitedBy().getUsername() : null);
        dto.setCreatedAt(entity.getInvitedAt());
        dto.setRespondedAt(entity.getRespondedAt());
        if (collabUser != null) {
            String roleName = collabUser.getRole() != null ? collabUser.getRole().getName().toLowerCase(Locale.ROOT) : "estudiante";
            dto.setUser(new CollaboratorUserDto(
                    collabUser.getId(),
                    collabUser.getUsername(),
                    collabUser.getSemester(),
                    roleName.contains("admin") ? "admin" : "estudiante"
            ));
        }
        dto.setRepository(repositoryDto);
        return dto;
    }

    public static String toFrontendStatus(CollaboratorStatus status) {
        return status == CollaboratorStatus.ACEPTADO ? "aceptado" : "pendiente";
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRepositoryId() { return repositoryId; }
    public void setRepositoryId(String repositoryId) { this.repositoryId = repositoryId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getInvitedBy() { return invitedBy; }
    public void setInvitedBy(String invitedBy) { this.invitedBy = invitedBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getRespondedAt() { return respondedAt; }
    public void setRespondedAt(LocalDateTime respondedAt) { this.respondedAt = respondedAt; }

    public CollaboratorUserDto getUser() { return user; }
    public void setUser(CollaboratorUserDto user) { this.user = user; }

    public RepositoryResponseDto getRepository() { return repository; }
    public void setRepository(RepositoryResponseDto repository) { this.repository = repository; }

    public record CollaboratorUserDto(Long id, String username, Integer semester, String role) {}
}
