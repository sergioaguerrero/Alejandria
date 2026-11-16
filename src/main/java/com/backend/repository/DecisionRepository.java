package com.backend.repository;

import com.backend.domain.governance.Decision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface DecisionRepository extends JpaRepository<Decision, Long> {

    Optional<Decision> findByReportId(Long reportId);

    @Query("SELECT d FROM Decision d JOIN FETCH d.moderator WHERE d.report.id IN :reportIds")
    List<Decision> findByReportIdInWithModerator(@Param("reportIds") Collection<Long> reportIds);
}
