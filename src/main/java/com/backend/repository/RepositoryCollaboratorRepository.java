package com.backend.repository;

import com.backend.cross.CollaboratorStatus;
import com.backend.domain.repos.RepositoryCollaborator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface RepositoryCollaboratorRepository extends JpaRepository<RepositoryCollaborator, Long> {

    @Query("""
            SELECT c FROM RepositoryCollaborator c
            JOIN FETCH c.user u
            LEFT JOIN FETCH u.role
            JOIN FETCH c.invitedBy
            JOIN FETCH c.studyRepository sr
            WHERE sr.id = :repositoryId
            ORDER BY c.status ASC, c.invitedAt DESC
            """)
    List<RepositoryCollaborator> findByRepositoryIdWithDetails(@Param("repositoryId") Long repositoryId);

    @Query("""
            SELECT c FROM RepositoryCollaborator c
            JOIN FETCH c.studyRepository sr
            JOIN FETCH sr.subject s
            JOIN FETCH s.semester
            JOIN FETCH sr.author
            JOIN FETCH c.invitedBy
            JOIN FETCH c.user u
            WHERE u.id = :userId
            ORDER BY c.invitedAt DESC
            """)
    List<RepositoryCollaborator> findByUserIdWithDetails(@Param("userId") Long userId);

    @Query("""
            SELECT c.studyRepository.id, c.status FROM RepositoryCollaborator c
            WHERE c.user.id = :userId
              AND c.studyRepository.id IN :repositoryIds
            """)
    List<Object[]> findStatusesByUserIdAndRepositoryIds(
            @Param("userId") Long userId,
            @Param("repositoryIds") Collection<Long> repositoryIds
    );

    Optional<RepositoryCollaborator> findByStudyRepositoryIdAndUserId(Long repositoryId, Long userId);

    Optional<RepositoryCollaborator> findByStudyRepositoryIdAndUserUsernameIgnoreCase(Long repositoryId, String username);

    boolean existsByStudyRepositoryIdAndUserIdAndStatus(Long repositoryId, Long userId, CollaboratorStatus status);

    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM RepositoryCollaborator c WHERE c.studyRepository.id = :repositoryId")
    void deleteByStudyRepositoryId(@Param("repositoryId") Long repositoryId);
}
