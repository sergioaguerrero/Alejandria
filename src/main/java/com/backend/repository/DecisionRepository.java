package com.backend.repository;

import com.backend.domain.governance.Decision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DecisionRepository extends JpaRepository<Decision, Long> {

    @Query(value = "SELECT PKG_MODERACION.fn_obtener_decision_reporte(:reportId) FROM DUAL", nativeQuery = true)
    Long fnObtenerDecisionReporte(@Param("reportId") Long reportId);
}
