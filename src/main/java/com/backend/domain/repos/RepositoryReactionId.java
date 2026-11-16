package com.backend.domain.repos;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class RepositoryReactionId implements Serializable {

    @Column(name = "repositorio_id", nullable = false)
    private Long repositoryId;

    @Column(name = "usuario_id", nullable = false)
    private Long userId;

    protected RepositoryReactionId() {}

    public RepositoryReactionId(Long repositoryId, Long userId) {
        this.repositoryId = repositoryId;
        this.userId = userId;
    }

    public Long getRepositoryId() { return repositoryId; }
    public Long getUserId() { return userId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RepositoryReactionId that)) return false;
        return Objects.equals(repositoryId, that.repositoryId) && Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(repositoryId, userId);
    }
}
