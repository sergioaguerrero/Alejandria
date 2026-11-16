package com.backend.repository;

import com.backend.domain.repos.StudyRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudyRepositoryRepository extends JpaRepository<StudyRepository, Long> {

    @Query("""
            SELECT r FROM StudyRepository r
            JOIN FETCH r.subject s
            JOIN FETCH s.semester
            JOIN FETCH r.author
            WHERE r.id = :id
            """)
    Optional<StudyRepository> findByIdWithDetails(@Param("id") Long id);

    @Query("""
            SELECT r FROM StudyRepository r
            JOIN FETCH r.subject s
            JOIN FETCH s.semester
            JOIN FETCH r.author a
            WHERE LOWER(a.username) = LOWER(:username)
            ORDER BY r.createdAt DESC
            """)
    List<StudyRepository> findByAuthorUsernameOrderByCreatedAtDesc(@Param("username") String username);

    @Query(
            value = """
                    SELECT r FROM StudyRepository r
                    JOIN FETCH r.subject s
                    JOIN FETCH s.semester sem
                    JOIN FETCH r.author
                    WHERE (:subjectId IS NULL OR s.id = :subjectId)
                      AND (:semester IS NULL OR sem.number = :semester)
                      AND (:search IS NULL
                           OR LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(r.description) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')))
                    """,
            countQuery = """
                    SELECT COUNT(r) FROM StudyRepository r
                    JOIN r.subject s
                    JOIN s.semester sem
                    WHERE (:subjectId IS NULL OR s.id = :subjectId)
                      AND (:semester IS NULL OR sem.number = :semester)
                      AND (:search IS NULL
                           OR LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(r.description) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')))
                    """
    )
    Page<StudyRepository> findWithFilters(@Param("subjectId") Long subjectId,
                                          @Param("semester") Integer semester,
                                          @Param("search") String search,
                                          Pageable pageable);
}
