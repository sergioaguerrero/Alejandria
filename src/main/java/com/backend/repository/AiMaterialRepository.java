package com.backend.repository;

import com.backend.domain.ai.AiMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AiMaterialRepository extends JpaRepository<AiMaterial, Long> {
}
