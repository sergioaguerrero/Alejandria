package com.backend.repository;

import com.backend.domain.governance.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    @Query("""
            SELECT r FROM Report r
            JOIN FETCH r.reporter
            LEFT JOIN FETCH r.targetUser
            LEFT JOIN FETCH r.moderator
            LEFT JOIN FETCH r.studyRepository sr
            LEFT JOIN FETCH sr.author
            LEFT JOIN FETCH sr.subject s
            LEFT JOIN FETCH s.semester
            WHERE r.id IN :ids
            """)
    List<Report> findAllWithDetailsByIdIn(@Param("ids") Collection<Long> ids);

    @Query("""
            SELECT r FROM Report r
            JOIN FETCH r.reporter
            LEFT JOIN FETCH r.targetUser
            LEFT JOIN FETCH r.moderator
            LEFT JOIN FETCH r.studyRepository sr
            LEFT JOIN FETCH sr.author
            LEFT JOIN FETCH sr.subject s
            LEFT JOIN FETCH s.semester
            WHERE r.id = :id
            """)
    Optional<Report> findWithDetailsById(@Param("id") Long id);
}
