package com.backend.repository;

import com.backend.domain.identity.UserFollow;
import com.backend.domain.identity.UserFollowId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserFollowRepository extends JpaRepository<UserFollow, UserFollowId> {
}
