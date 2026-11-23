package com.backend.repository;

import com.backend.domain.repos.RepositoryLike;
import com.backend.domain.repos.RepositoryReactionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RepositoryLikeRepository extends JpaRepository<RepositoryLike, RepositoryReactionId> {
}
