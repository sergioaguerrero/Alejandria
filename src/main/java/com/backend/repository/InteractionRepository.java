package com.backend.repository;

import com.backend.domain.analytic.Interaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface InteractionRepository extends JpaRepository<Interaction, Long> {

    @Query(value = "SELECT PKG_ANALITICAS.fn_indice_demanda_materia(:subjectId, :from, :to) FROM DUAL", nativeQuery = true)
    double fnIndiceDemandaMateria(@Param("subjectId") Long subjectId,
                                  @Param("from") LocalDateTime from,
                                  @Param("to") LocalDateTime to);

    @Query(value = "SELECT PKG_ANALITICAS.fn_contar_usuarios_activos(:since) FROM DUAL", nativeQuery = true)
    long fnContarUsuariosActivos(@Param("since") LocalDateTime since);
}
