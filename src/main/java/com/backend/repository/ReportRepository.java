package com.backend.repository;

import com.backend.cross.ReportStatus;
import com.backend.domain.governance.Report;
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
public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByStatus(ReportStatus status);

    @Query("""
            SELECT r FROM Report r
            JOIN FETCH r.reporter
            LEFT JOIN FETCH r.moderator
            LEFT JOIN FETCH r.resource res
            LEFT JOIN FETCH res.subject rs
            LEFT JOIN FETCH rs.semester
            LEFT JOIN FETCH res.uploadedBy
            LEFT JOIN FETCH res.studyRepository
            LEFT JOIN FETCH r.studyRepository sr
            LEFT JOIN FETCH sr.subject srs
            LEFT JOIN FETCH srs.semester
            LEFT JOIN FETCH sr.author
            LEFT JOIN FETCH r.targetUser tu
            LEFT JOIN FETCH tu.role
            ORDER BY r.date DESC, r.id DESC
            """)
    List<Report> findAllWithDetails();

    @Query("""
            SELECT r FROM Report r
            JOIN FETCH r.reporter
            LEFT JOIN FETCH r.moderator
            LEFT JOIN FETCH r.resource res
            LEFT JOIN FETCH res.subject rs
            LEFT JOIN FETCH rs.semester
            LEFT JOIN FETCH res.uploadedBy
            LEFT JOIN FETCH res.studyRepository
            LEFT JOIN FETCH r.studyRepository sr
            LEFT JOIN FETCH sr.subject srs
            LEFT JOIN FETCH srs.semester
            LEFT JOIN FETCH sr.author
            LEFT JOIN FETCH r.targetUser tu
            LEFT JOIN FETCH tu.role
            WHERE r.id = :id
            """)
    Optional<Report> findByIdWithDetails(@Param("id") Long id);

    boolean existsByReporterIdAndTargetTypeAndStatusInAndResourceId(
            Long reporterId,
            com.backend.cross.ReportTargetType targetType,
            Collection<ReportStatus> statuses,
            Long resourceId
    );

    boolean existsByReporterIdAndTargetTypeAndStatusInAndStudyRepositoryId(
            Long reporterId,
            com.backend.cross.ReportTargetType targetType,
            Collection<ReportStatus> statuses,
            Long repositoryId
    );

    boolean existsByReporterIdAndTargetTypeAndStatusInAndTargetUserId(
            Long reporterId,
            com.backend.cross.ReportTargetType targetType,
            Collection<ReportStatus> statuses,
            Long targetUserId
    );

    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Report r SET r.studyRepository = null WHERE r.studyRepository.id = :repositoryId")
    int clearRepositoryReference(@Param("repositoryId") Long repositoryId);

    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Report r SET r.resource = null WHERE r.resource.id = :resourceId")
    int clearResourceReference(@Param("resourceId") Long resourceId);

    @Query(value = "SELECT motivo, estado, COUNT(*) FROM REPORTE GROUP BY motivo, estado", nativeQuery = true)
    List<Object[]> countGroupedByReasonAndStatus();
}
