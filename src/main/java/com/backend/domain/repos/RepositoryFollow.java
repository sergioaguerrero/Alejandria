package com.backend.domain.repos;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "SEGUIMIENTO_REPOSITORIO")
public class RepositoryFollow {

    @EmbeddedId
    private RepositoryReactionId id;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime createdAt;

    protected RepositoryFollow() {}

    public RepositoryFollow(Long repositoryId, Long userId) {
        this.id = new RepositoryReactionId(repositoryId, userId);
        this.createdAt = LocalDateTime.now();
    }

    public RepositoryReactionId getId() { return id; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
