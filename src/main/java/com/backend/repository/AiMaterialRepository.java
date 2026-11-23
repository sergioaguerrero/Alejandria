package com.backend.repository;

import com.backend.domain.ai.AiMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AiMaterialRepository extends JpaRepository<AiMaterial, Long> {

    @Query(value = "SELECT PKG_IA_ESTUDIO.fn_usados_hoy_ia(:userId) FROM DUAL", nativeQuery = true)
    long fnUsadosHoyIa(@Param("userId") Long userId);

    @Query(value = "SELECT PKG_IA_ESTUDIO.fn_cuota_restante_ia(:userId, :dailyLimit) FROM DUAL", nativeQuery = true)
    long fnCuotaRestanteIa(@Param("userId") Long userId, @Param("dailyLimit") int dailyLimit);

    @Query(value = "SELECT PKG_IA_ESTUDIO.fn_contar_total_material_ia() FROM DUAL", nativeQuery = true)
    long fnContarTotalMaterialIa();
}
