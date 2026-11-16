package com.backend.repository;

import com.backend.cross.ResourceType;
import com.backend.domain.repos.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long>, JpaSpecificationExecutor<Resource> {

    Page<Resource> findBySubjectId(Long subjectId, Pageable pageable);

    long countByStudyRepositoryId(Long repositoryId);

    long countByUploadedById(Long uploadedById);

    @Query("""
            SELECT r.studyRepository.id, COUNT(r)
            FROM Resource r
            WHERE r.studyRepository.id IN :repositoryIds
              AND r.status = com.backend.cross.ResourceStatus.PUBLISHED
            GROUP BY r.studyRepository.id
            """)
    List<Object[]> countByStudyRepositoryIds(@Param("repositoryIds") Collection<Long> repositoryIds);

    List<Resource> findByStudyRepositoryIdOrderByUploadDateDesc(Long repositoryId);

    // No usar DISTINCT en JPQL: RECURSO_ACADEMICO tiene columna BLOB (archivo_bytes)
    // y Oracle falla con ORA-00932 al aplicar DISTINCT sobre LOBs; Hibernate 6 ya
    // desduplica las entidades raíz al hacer JOIN FETCH sobre colecciones.
    @Query("""
            SELECT r FROM Resource r
            JOIN FETCH r.subject s
            JOIN FETCH s.semester
            JOIN FETCH r.uploadedBy
            LEFT JOIN FETCH r.studyRepository
            LEFT JOIN FETCH r.tags
            WHERE r.id = :id
            """)
    Optional<Resource> findByIdWithDetails(@Param("id") Long id);

    @Query("""
            SELECT r FROM Resource r
            JOIN FETCH r.subject s
            JOIN FETCH s.semester
            JOIN FETCH r.uploadedBy
            LEFT JOIN FETCH r.studyRepository sr
            LEFT JOIN FETCH r.tags
            WHERE sr.id = :repositoryId
              AND r.status = com.backend.cross.ResourceStatus.PUBLISHED
            ORDER BY r.uploadDate DESC
            """)
    List<Resource> findByStudyRepositoryIdWithDetails(@Param("repositoryId") Long repositoryId);

    @Query("""
            SELECT r FROM Resource r
            JOIN FETCH r.subject s
            JOIN FETCH s.semester
            JOIN FETCH r.uploadedBy
            LEFT JOIN FETCH r.studyRepository sr
            LEFT JOIN FETCH r.tags
            WHERE sr.id = :repositoryId
              AND r.term = :term
              AND r.status = com.backend.cross.ResourceStatus.PUBLISHED
            ORDER BY r.uploadDate DESC
            """)
    List<Resource> findByStudyRepositoryIdAndTermWithDetails(@Param("repositoryId") Long repositoryId,
                                                             @Param("term") int term);

    @Query("""
            SELECT r FROM Resource r
            JOIN FETCH r.subject s
            JOIN FETCH s.semester
            JOIN FETCH r.uploadedBy u
            LEFT JOIN FETCH r.studyRepository
            LEFT JOIN FETCH r.tags
            WHERE LOWER(u.username) = LOWER(:username)
              AND r.status = com.backend.cross.ResourceStatus.PUBLISHED
            ORDER BY r.uploadDate DESC
            """)
    List<Resource> findByAuthorUsernameWithDetails(@Param("username") String username);

    @Query("""
            SELECT r.id, r.title, r.type, r.topic, r.totalViews, r.totalDownloads, r.uploadDate, r.uploadedBy.id, s.name
            FROM Resource r
            JOIN r.subject s
            WHERE r.status = com.backend.cross.ResourceStatus.PUBLISHED
            """)
    List<Object[]> findPublishedStatisticsRows();

    @Override
    @EntityGraph(attributePaths = {"subject", "subject.semester", "uploadedBy", "studyRepository", "tags"})
    Page<Resource> findAll(Specification<Resource> spec, Pageable pageable);

    // Los filtros son opcionales: si llegan null, no se aplican.
    @Query("""
            SELECT r FROM Resource r
            WHERE (:text IS NULL
                   OR LOWER(r.title) LIKE LOWER(CONCAT('%', :text, '%'))
                   OR LOWER(r.description) LIKE LOWER(CONCAT('%', :text, '%')))
              AND (:subjectId IS NULL OR r.subject.id = :subjectId)
              AND (:type IS NULL OR r.type = :type)
            """)
    Page<Resource> searchByTextAndFilters(@Param("text") String text,
                                          @Param("subjectId") Long subjectId,
                                          @Param("type") ResourceType type,
                                          Pageable pageable);
}
