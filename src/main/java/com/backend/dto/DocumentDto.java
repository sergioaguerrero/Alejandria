package com.backend.dto;

import com.backend.cross.ResourceType;
import com.backend.domain.repos.Resource;
import com.backend.domain.repos.StudyRepository;
import com.backend.domain.repos.Tag;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

/**
 * DTO completo de un documento académico consumido por el frontend.
 */
public class DocumentDto {

    private String id;
    private String repositoryId;
    private RepositorySummary repository;
    private SubjectDto subject;
    private String title;
    private String description;
    private String type;
    private int term;
    private String topic;
    private List<String> tags;
    private DocumentFileDto file;
    private String authorUsername;
    private String authorName;
    private int views;
    private int downloads;
    private LocalDateTime createdAt;

    public static DocumentDto fromEntity(Resource resource, String previewUrl) {
        DocumentDto dto = new DocumentDto();
        dto.setId(String.valueOf(resource.getId()));
        dto.setTitle(resource.getTitle());
        dto.setDescription(resource.getDescription());
        dto.setType(toFrontendType(resource.getType()));
        dto.setTerm(resource.getTerm());
        dto.setTopic(resource.getTopic());
        dto.setViews(resource.getTotalViews());
        dto.setDownloads(resource.getTotalDownloads());
        dto.setCreatedAt(resource.getUploadDate());

        StudyRepository repo = resource.getStudyRepository();
        if (repo != null) {
            dto.setRepositoryId(String.valueOf(repo.getId()));
            Long repoSubjectId = resource.getSubject() != null ? resource.getSubject().getId() : null;
            String repoAuthor = resource.getUploadedBy() != null ? resource.getUploadedBy().getUsername() : null;
            dto.setRepository(new RepositorySummary(
                    String.valueOf(repo.getId()),
                    repo.getName(),
                    repoSubjectId,
                    repoAuthor
            ));
        }

        if (resource.getSubject() != null) {
            dto.setSubject(SubjectDto.fromEntity(resource.getSubject()));
        }

        if (resource.getUploadedBy() != null) {
            dto.setAuthorUsername(resource.getUploadedBy().getUsername());
            dto.setAuthorName(resource.getUploadedBy().getName());
        }

        List<String> tagNames = resource.getTags() == null
                ? List.of()
                : resource.getTags().stream()
                        .map(Tag::getName)
                        .sorted(String::compareToIgnoreCase)
                        .toList();
        dto.setTags(tagNames);

        String originalName = resource.getFileName();
        if (originalName == null || originalName.isBlank()) {
            String fallbackExt = extensionFromMime(resource.getMimeType());
            originalName = (resource.getTitle() != null ? resource.getTitle() : "documento-" + resource.getId())
                    + "." + fallbackExt;
        }
        String extension = extractExtension(originalName, resource.getMimeType());
        dto.setFile(new DocumentFileDto(
                originalName,
                extension,
                resource.getMimeType(),
                resource.getFileSizeBytes(),
                previewUrl
        ));

        return dto;
    }

    public static String toFrontendType(ResourceType type) {
        if (type == null) return "apunte";
        return switch (type) {
            case NOTE -> "apunte";
            case GUIDE -> "guia";
            case SUMMARY -> "resumen";
            case PROJECT -> "proyecto";
            case WORKSHOP -> "taller";
        };
    }

    private static String extractExtension(String fileName, String mimeType) {
        if (fileName != null) {
            int dot = fileName.lastIndexOf('.');
            if (dot >= 0 && dot < fileName.length() - 1) {
                return fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
            }
        }
        return extensionFromMime(mimeType);
    }

    private static String extensionFromMime(String mimeType) {
        if (mimeType == null) return "pdf";
        return switch (mimeType.toLowerCase(Locale.ROOT)) {
            case "application/pdf" -> "pdf";
            case "application/msword" -> "doc";
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> "docx";
            case "application/vnd.ms-powerpoint" -> "ppt";
            case "application/vnd.openxmlformats-officedocument.presentationml.presentation" -> "pptx";
            case "application/vnd.ms-excel" -> "xls";
            case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" -> "xlsx";
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            default -> "pdf";
        };
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRepositoryId() { return repositoryId; }
    public void setRepositoryId(String repositoryId) { this.repositoryId = repositoryId; }

    public RepositorySummary getRepository() { return repository; }
    public void setRepository(RepositorySummary repository) { this.repository = repository; }

    public SubjectDto getSubject() { return subject; }
    public void setSubject(SubjectDto subject) { this.subject = subject; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public int getTerm() { return term; }
    public void setTerm(int term) { this.term = term; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public DocumentFileDto getFile() { return file; }
    public void setFile(DocumentFileDto file) { this.file = file; }

    public String getAuthorUsername() { return authorUsername; }
    public void setAuthorUsername(String authorUsername) { this.authorUsername = authorUsername; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public int getViews() { return views; }
    public void setViews(int views) { this.views = views; }

    public int getDownloads() { return downloads; }
    public void setDownloads(int downloads) { this.downloads = downloads; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public record RepositorySummary(String id, String name, Long subjectId, String authorUsername) {}

    public record DocumentFileDto(String name, String extension, String mime, long sizeBytes, String url) {}
}
