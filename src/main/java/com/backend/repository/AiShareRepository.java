package com.backend.repository;

import com.backend.domain.ai.AiShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AiShareRepository extends JpaRepository<AiShare, Long> {
}
