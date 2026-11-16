package com.backend.domain.repos;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import com.backend.cross.ResourceStatus;
import com.backend.cross.ResourceType;
import com.backend.domain.academy.Subject;
import com.backend.domain.identity.User;

@Entity
@Table(name = "RECURSO_ACADEMICO")
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "titulo", nullable = false, length = 200)
    private String title;

    @Column(name = "descripcion", length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_recurso", nullable = false, length = 20)
    private ResourceType type;

    @Lob
    @Column(name = "archivo_bytes", nullable = false)
    private byte[] fileBytes;

    @Column(name = "tipo_mime", nullable = false, length = 100)
    private String mimeType;

    @Column(name = "tamano_bytes", nullable = false)
    private long fileSizeBytes;

    @Column(name = "fecha_subida", nullable = false)
    private LocalDateTime uploadDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private ResourceStatus status;

    @Column(name = "total_descargas", nullable = false)
    private int totalDownloads;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subido_por")
    private User uploadedBy;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "materia_id")
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repositorio_id")
    private StudyRepository studyRepository;

    @ManyToMany
    @JoinTable(
            name = "RECURSO_ETIQUETA",
            joinColumns = @JoinColumn(name = "recurso_id"),
            inverseJoinColumns = @JoinColumn(name = "etiqueta_id")
    )
    private Set<Tag> tags = new HashSet<>();

    protected Resource() {}

    public Resource(String title, String description, ResourceType type,
                    byte[] fileBytes, String mimeType, long fileSizeBytes,
                    User uploadedBy, Subject subject) {
        this.title = title;
        this.description = description;
        this.type = type;
        this.fileBytes = fileBytes;
        this.mimeType = mimeType;
        this.fileSizeBytes = fileSizeBytes;
        this.uploadedBy = uploadedBy;
        this.subject = subject;
        this.uploadDate = LocalDateTime.now();
        this.status = ResourceStatus.PENDING;
        this.totalDownloads = 0;
    }

    public void publish() { this.status = ResourceStatus.PUBLISHED; }
    public void remove() { this.status = ResourceStatus.REMOVED; }

    public Long getId() { return id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ResourceType getType() { return type; }
    public void setType(ResourceType type) { this.type = type; }

    public byte[] getFileBytes() { return fileBytes; }
    public void setFileBytes(byte[] fileBytes) { this.fileBytes = fileBytes; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }

    public LocalDateTime getUploadDate() { return uploadDate; }

    public ResourceStatus getStatus() { return status; }
    public void setStatus(ResourceStatus status) { this.status = status; }

    public int getTotalDownloads() { return totalDownloads; }
    public void setTotalDownloads(int totalDownloads) { this.totalDownloads = totalDownloads; }

    public User getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(User uploadedBy) { this.uploadedBy = uploadedBy; }

    public Subject getSubject() { return subject; }
    public void setSubject(Subject subject) { this.subject = subject; }

    public StudyRepository getStudyRepository() { return studyRepository; }
    public void setStudyRepository(StudyRepository studyRepository) { this.studyRepository = studyRepository; }

    public Set<Tag> getTags() { return tags; }
    public void setTags(Set<Tag> tags) { this.tags = tags; }
}
