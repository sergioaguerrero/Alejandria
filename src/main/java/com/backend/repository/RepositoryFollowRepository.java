package com.backend.repository;

import com.backend.domain.repos.RepositoryFollow;
import com.backend.domain.repos.RepositoryReactionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RepositoryFollowRepository extends JpaRepository<RepositoryFollow, RepositoryReactionId> {
}
