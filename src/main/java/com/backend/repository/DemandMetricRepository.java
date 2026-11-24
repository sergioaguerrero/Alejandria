package com.backend.repository;

import com.backend.domain.analytic.DemandMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DemandMetricRepository extends JpaRepository<DemandMetric, Long> {
}
