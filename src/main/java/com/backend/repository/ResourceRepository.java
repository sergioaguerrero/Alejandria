package com.backend.repository;

import com.backend.domain.repos.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    Page<Resource> findByMateriaId(Long materiaId, Pageable pageable);

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
                                          @Param("SubjectId") Long SubjectId,
                                          @Param("type") String type,
                                          Pageable pageable);
}