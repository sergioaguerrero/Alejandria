package com.backend.domain.identity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

/**
 * Clave primaria compuesta para la relación seguidor → seguido entre usuarios.
 */
@Embeddable
public class UserFollowId implements Serializable {

    @Column(name = "seguidor_id", nullable = false)
    private Long followerId;

    @Column(name = "seguido_id", nullable = false)
    private Long followedId;

    protected UserFollowId() {}

    public UserFollowId(Long followerId, Long followedId) {
        this.followerId = followerId;
        this.followedId = followedId;
    }

    public Long getFollowerId() { return followerId; }
    public Long getFollowedId() { return followedId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserFollowId that)) return false;
        return Objects.equals(followerId, that.followerId) && Objects.equals(followedId, that.followedId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(followerId, followedId);
    }
}
