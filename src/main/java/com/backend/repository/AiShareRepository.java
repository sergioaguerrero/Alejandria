package com.backend.repository;

import com.backend.domain.ai.AiShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AiShareRepository extends JpaRepository<AiShare, Long> {

    @Query(value = "SELECT PKG_IA_ESTUDIO.fn_contar_total_compartidos_ia() FROM DUAL", nativeQuery = true)
    long fnContarTotalCompartidosIa();

    @Query(value = "SELECT PKG_IA_ESTUDIO.fn_obtener_compartido_ia(:materialId, :recipientId) FROM DUAL", nativeQuery = true)
    Long fnObtenerCompartidoIa(@Param("materialId") Long materialId, @Param("recipientId") Long recipientId);
}
