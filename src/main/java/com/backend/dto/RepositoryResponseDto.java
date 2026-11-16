package com.backend.dto;

import com.backend.domain.repos.StudyRepository;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

/**
 * DTO de respuesta de un repositorio de estudio alineado con el contrato del frontend.
 */
public class RepositoryResponseDto {

    private String id;
    private String name;
    private String description;
    private Long subjectId;
    private String subjectName;
    private SubjectDto subject;
    private Integer semester;
    private String authorUsername;
    private String authorName;
    private int likes;
    private boolean liked;
    private boolean followed;
    private long followersCount;
    private int documentCount;
    private boolean canUpload;

    @JsonProperty("isCollaborator")
    private boolean collaborator;

    private String collaboratorStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static RepositoryResponseDto fromEntity(
            StudyRepository repo,
            int documentCount,
            boolean liked,
            boolean followed,
            long followersCount,
            boolean canUpload
    ) {
        return fromEntity(repo, documentCount, liked, followed, followersCount, canUpload, false, null);
    }

    public static RepositoryResponseDto fromEntity(
            StudyRepository repo,
            int documentCount,
            boolean liked,
            boolean followed,
            long followersCount,
            boolean canUpload,
            boolean isCollaborator,
            String collaboratorStatus
    ) {
        RepositoryResponseDto dto = new RepositoryResponseDto();
        dto.setId(String.valueOf(repo.getId()));
        dto.setName(repo.getName());
        dto.setDescription(repo.getDescription());
        dto.setLikes(repo.getLikes());
        dto.setLiked(liked);
        dto.setFollowed(followed);
        dto.setFollowersCount(followersCount);
        dto.setDocumentCount(documentCount);
        dto.setCanUpload(canUpload);
        dto.setCollaborator(isCollaborator);
        dto.setCollaboratorStatus(collaboratorStatus);
        dto.setCreatedAt(repo.getCreatedAt());
        dto.setUpdatedAt(repo.getUpdatedAt());

        if (repo.getSubject() != null) {
            SubjectDto subjectDto = SubjectDto.fromEntity(repo.getSubject());
            dto.setSubject(subjectDto);
            dto.setSubjectId(subjectDto.getId());
            dto.setSubjectName(subjectDto.getName());
            dto.setSemester(subjectDto.getSemester());
        }

        if (repo.getAuthor() != null) {
            dto.setAuthorUsername(repo.getAuthor().getUsername());
            dto.setAuthorName(repo.getAuthor().getName());
        }

        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

    public SubjectDto getSubject() { return subject; }
    public void setSubject(SubjectDto subject) { this.subject = subject; }

    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }

    public String getAuthorUsername() { return authorUsername; }
    public void setAuthorUsername(String authorUsername) { this.authorUsername = authorUsername; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public int getLikes() { return likes; }
    public void setLikes(int likes) { this.likes = likes; }

    public boolean isLiked() { return liked; }
    public void setLiked(boolean liked) { this.liked = liked; }

    public boolean isFollowed() { return followed; }
    public void setFollowed(boolean followed) { this.followed = followed; }

    public long getFollowersCount() { return followersCount; }
    public void setFollowersCount(long followersCount) { this.followersCount = followersCount; }

    public int getDocumentCount() { return documentCount; }
    public void setDocumentCount(int documentCount) { this.documentCount = documentCount; }

    public boolean isCanUpload() { return canUpload; }
    public void setCanUpload(boolean canUpload) { this.canUpload = canUpload; }

    @JsonProperty("isCollaborator")
    public boolean isCollaborator() { return collaborator; }
    @JsonProperty("isCollaborator")
    public void setCollaborator(boolean collaborator) { this.collaborator = collaborator; }

    public String getCollaboratorStatus() { return collaboratorStatus; }
    public void setCollaboratorStatus(String collaboratorStatus) { this.collaboratorStatus = collaboratorStatus; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
