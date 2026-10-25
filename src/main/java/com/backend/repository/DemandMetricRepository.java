package com.backend.repository;

import com.backend.domain.analytic.DemandMetric;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DemandMetricRepository extends JpaRepository<DemandMetric, Long> {

    Optional<DemandMetric> findBySubject_IdAndAcademicPeriod(Long subjectId, String academicPeriod);

    List<DemandMetric> findByAcademicPeriodOrderByTotalQueriesDesc(String academicPeriod, Pageable pageable);
}