package com.backend.repository;

import com.backend.domain.ai.AiShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface AiShareRepository extends JpaRepository<AiShare, Long> {

    @Query("""
            SELECT s FROM AiShare s
            JOIN FETCH s.material m
            JOIN FETCH m.owner
            LEFT JOIN FETCH m.studyRepository
            JOIN FETCH s.sender
            WHERE s.id IN :ids
            """)
    List<AiShare> findAllWithDetailsByIdIn(@Param("ids") Collection<Long> ids);
}
