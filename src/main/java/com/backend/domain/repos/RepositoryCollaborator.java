package com.backend.domain.repos;

import com.backend.cross.CollaboratorStatus;
import com.backend.domain.identity.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Representa la invitación o colaboración activa de un estudiante en un repositorio de estudio.
 */
@Entity
@Table(
        name = "COLABORADOR_REPOSITORIO",
        uniqueConstraints = @UniqueConstraint(name = "uq_colab_repo_usuario", columnNames = {"repositorio_id", "usuario_id"}),
        indexes = @Index(name = "idx_colab_usuario_estado", columnList = "usuario_id, estado")
)
public class RepositoryCollaborator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "repositorio_id", nullable = false)
    private StudyRepository studyRepository;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invitado_por_id", nullable = false)
    private User invitedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private CollaboratorStatus status = CollaboratorStatus.PENDIENTE;

    @Column(name = "fecha_invitacion", nullable = false)
    private LocalDateTime invitedAt;

    @Column(name = "fecha_respuesta")
    private LocalDateTime respondedAt;

    protected RepositoryCollaborator() {}

    public RepositoryCollaborator(StudyRepository studyRepository, User user, User invitedBy) {
        this.studyRepository = studyRepository;
        this.user = user;
        this.invitedBy = invitedBy;
        this.status = CollaboratorStatus.PENDIENTE;
        this.invitedAt = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.invitedAt == null) {
            this.invitedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = CollaboratorStatus.PENDIENTE;
        }
    }

    public void accept() {
        this.status = CollaboratorStatus.ACEPTADO;
        this.respondedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public StudyRepository getStudyRepository() { return studyRepository; }

    public User getUser() { return user; }

    public User getInvitedBy() { return invitedBy; }

    public CollaboratorStatus getStatus() { return status; }

    public LocalDateTime getInvitedAt() { return invitedAt; }

    public LocalDateTime getRespondedAt() { return respondedAt; }
}
