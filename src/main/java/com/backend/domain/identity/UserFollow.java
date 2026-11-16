package com.backend.domain.identity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * Representa que un usuario sigue a otro en Alejandría.
 */
@Entity
@Table(name = "SEGUIMIENTO_USUARIO")
public class UserFollow {

    @EmbeddedId
    private UserFollowId id;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime createdAt;

    protected UserFollow() {}

    public UserFollow(Long followerId, Long followedId) {
        this.id = new UserFollowId(followerId, followedId);
        this.createdAt = LocalDateTime.now();
    }

    public UserFollowId getId() { return id; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
