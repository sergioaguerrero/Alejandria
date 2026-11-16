package com.backend.repository;

import com.backend.domain.repos.StudyRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudyRepositoryRepository
        extends JpaRepository<StudyRepository, Long>, JpaSpecificationExecutor<StudyRepository> {

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

    List<StudyRepository> findByAuthorId(Long authorId);

    long countByAuthorId(Long authorId);

    @Override
    @EntityGraph(attributePaths = {"subject", "subject.semester", "author"})
    Page<StudyRepository> findAll(Specification<StudyRepository> spec, Pageable pageable);
}
