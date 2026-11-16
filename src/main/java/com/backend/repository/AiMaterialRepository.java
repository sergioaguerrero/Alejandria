package com.backend.repository;

import com.backend.domain.ai.AiMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AiMaterialRepository extends JpaRepository<AiMaterial, Long> {

    long countByOwnerIdAndCreatedAtGreaterThanEqual(Long ownerId, LocalDateTime since);

    @Query("""
            SELECT m FROM AiMaterial m
            JOIN FETCH m.owner
            LEFT JOIN FETCH m.studyRepository
            WHERE m.id = :id
            """)
    Optional<AiMaterial> findByIdWithDetails(@Param("id") Long id);

    @Query("""
            SELECT m FROM AiMaterial m
            JOIN FETCH m.owner o
            LEFT JOIN FETCH m.studyRepository
            WHERE o.id = :ownerId
              AND m.savedInMyStudy = true
            ORDER BY m.createdAt DESC
            """)
    List<AiMaterial> findSavedByOwnerId(@Param("ownerId") Long ownerId);

    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE AiMaterial m SET m.studyRepository = null WHERE m.studyRepository.id = :repositoryId")
    int clearRepositoryReference(@Param("repositoryId") Long repositoryId);

    @Query("""
            SELECT m.id, m.contentType, sr.id, m.repositoryName, m.subjectName, m.createdAt
            FROM AiMaterial m
            LEFT JOIN m.studyRepository sr
            WHERE m.createdAt >= :since
            """)
    List<Object[]> findStatisticsRowsSince(@Param("since") LocalDateTime since);
}
