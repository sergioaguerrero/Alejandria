package com.backend.repository;

import com.backend.cross.ReportStatus;
import com.backend.domain.governance.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByStatus(ReportStatus status);

    @Query(value = "SELECT motivo, estado, COUNT(*) FROM REPORTE GROUP BY motivo, estado", nativeQuery = true)
    List<Object[]> countGroupedByReasonAndStatus();
}
