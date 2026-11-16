package com.backend.domain.governance;

import com.backend.cross.ReportReason;
import com.backend.cross.ReportStatus;
import com.backend.cross.ReportTargetType;
import com.backend.domain.identity.User;
import com.backend.domain.repos.Resource;
import com.backend.domain.repos.StudyRepository;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "REPORTE")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "motivo", nullable = false, length = 30)
    private ReportReason reason;

    @Column(name = "descripcion", length = 1000)
    private String description;

    @Column(name = "fecha_reporte", nullable = false)
    private LocalDateTime date;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private ReportStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_objetivo", nullable = false, length = 20)
    private ReportTargetType targetType = ReportTargetType.DOCUMENT;

    @Column(name = "etiqueta_objetivo", length = 255)
    private String targetLabel;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reportante_id")
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recurso_id")
    private Resource resource;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repositorio_id")
    private StudyRepository studyRepository;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_objetivo_id")
    private User targetUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "moderador_id")
    private User moderator;

    protected Report() {}

    public Report(ReportReason reason, String description, User reporter, Resource resource) {
        this(reason, description, reporter, ReportTargetType.DOCUMENT,
                resource != null ? resource.getTitle() : null, resource, null,
                resource != null ? resource.getUploadedBy() : null);
    }

    public Report(
            ReportReason reason,
            String description,
            User reporter,
            ReportTargetType targetType,
            String targetLabel,
            Resource resource,
            StudyRepository studyRepository,
            User targetUser
    ) {
        this.reason = reason;
        this.description = description;
        this.reporter = reporter;
        this.targetType = targetType;
        this.targetLabel = targetLabel;
        this.resource = resource;
        this.studyRepository = studyRepository;
        this.targetUser = targetUser;
        this.date = LocalDateTime.now();
        this.status = ReportStatus.OPEN;
    }

    public void assignModerator(User moderator) {
        this.moderator = moderator;
        this.status = ReportStatus.UNDER_REVIEW;
    }

    public void close() {
        this.status = ReportStatus.RESOLVED;
    }

    public Long getId() { return id; }
    public ReportReason getReason() { return reason; }
    public String getDescription() { return description; }
    public LocalDateTime getDate() { return date; }
    public void setDate(LocalDateTime date) { this.date = date; }
    public ReportStatus getStatus() { return status; }
    public void setStatus(ReportStatus status) { this.status = status; }
    public ReportTargetType getTargetType() { return targetType; }
    public void setTargetType(ReportTargetType targetType) { this.targetType = targetType; }
    public String getTargetLabel() { return targetLabel; }
    public void setTargetLabel(String targetLabel) { this.targetLabel = targetLabel; }
    public User getReporter() { return reporter; }
    public Resource getResource() { return resource; }
    public void setResource(Resource resource) { this.resource = resource; }
    public StudyRepository getStudyRepository() { return studyRepository; }
    public void setStudyRepository(StudyRepository studyRepository) { this.studyRepository = studyRepository; }
    public User getTargetUser() { return targetUser; }
    public void setTargetUser(User targetUser) { this.targetUser = targetUser; }
    public User getModerator() { return moderator; }
    public void setModerator(User moderator) { this.moderator = moderator; }
}
