package com.backend.repository;

import com.backend.domain.identity.User;
import com.backend.domain.repos.RepositoryFollow;
import com.backend.domain.repos.RepositoryReactionId;
import com.backend.domain.repos.StudyRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;

@Repository
public interface RepositoryFollowRepository extends JpaRepository<RepositoryFollow, RepositoryReactionId> {

    long countByIdRepositoryId(Long repositoryId);

    @Query("SELECT rf.id.repositoryId, COUNT(rf) FROM RepositoryFollow rf WHERE rf.id.repositoryId IN :repositoryIds GROUP BY rf.id.repositoryId")
    List<Object[]> countFollowersByRepositoryIds(@Param("repositoryIds") Collection<Long> repositoryIds);

    @Query("SELECT rf.id.repositoryId FROM RepositoryFollow rf WHERE rf.id.userId = :userId AND rf.id.repositoryId IN :repositoryIds")
    List<Long> findFollowedRepositoryIds(@Param("userId") Long userId,
                                         @Param("repositoryIds") Collection<Long> repositoryIds);

    @Query("""
            SELECT r FROM StudyRepository r
            JOIN FETCH r.subject s
            JOIN FETCH s.semester
            JOIN FETCH r.author
            JOIN RepositoryFollow rf ON rf.id.repositoryId = r.id
            WHERE rf.id.userId = :userId
            ORDER BY rf.createdAt DESC
            """)
    List<StudyRepository> findFollowedRepositoriesByUserId(@Param("userId") Long userId);

    @Query("""
            SELECT u FROM User u
            JOIN RepositoryFollow rf ON rf.id.userId = u.id
            WHERE rf.id.repositoryId = :repositoryId
              AND u.verified = true
            """)
    List<User> findFollowerUsersByRepositoryId(@Param("repositoryId") Long repositoryId);

    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM RepositoryFollow rf WHERE rf.id.repositoryId = :repositoryId")
    void deleteByIdRepositoryId(@Param("repositoryId") Long repositoryId);
}
