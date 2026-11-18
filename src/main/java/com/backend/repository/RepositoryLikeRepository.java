package com.backend.repository;

import com.backend.domain.repos.RepositoryLike;
import com.backend.domain.repos.RepositoryReactionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;

@Repository
public interface RepositoryLikeRepository extends JpaRepository<RepositoryLike, RepositoryReactionId> {

    @Query("SELECT rl.id.repositoryId FROM RepositoryLike rl WHERE rl.id.userId = :userId AND rl.id.repositoryId IN :repositoryIds")
    List<Long> findLikedRepositoryIds(@Param("userId") Long userId,
                                      @Param("repositoryIds") Collection<Long> repositoryIds);

    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM RepositoryLike rl WHERE rl.id.repositoryId = :repositoryId")
    void deleteByIdRepositoryId(@Param("repositoryId") Long repositoryId);
}
