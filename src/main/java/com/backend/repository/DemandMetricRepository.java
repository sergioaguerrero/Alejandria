package com.backend.repository;

import com.backend.domain.analytic.DemandMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DemandMetricRepository extends JpaRepository<DemandMetric, Long> {

    @Query(value = "SELECT PKG_ANALITICAS.fn_obtener_metrica_materia(:subjectId, :academicPeriod) FROM DUAL", nativeQuery = true)
    Long fnObtenerMetricaMateria(@Param("subjectId") Long subjectId, @Param("academicPeriod") String academicPeriod);
}
