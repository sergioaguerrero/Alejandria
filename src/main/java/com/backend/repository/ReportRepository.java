package com.backend.repository;

import com.backend.domain.governance.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    @Query(value = "SELECT PKG_MODERACION.fn_existe_reporte_activo(:reporterId, :targetType, :targetId) FROM DUAL", nativeQuery = true)
    int fnExisteReporteActivo(@Param("reporterId") Long reporterId,
                              @Param("targetType") String targetType,
                              @Param("targetId") Long targetId);
}
