package com.backend.repository;

import com.backend.domain.repos.RepositoryCollaborator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RepositoryCollaboratorRepository extends JpaRepository<RepositoryCollaborator, Long> {

    @Query(value = "SELECT PKG_REPOSITORIOS.fn_estado_colaborador_repo(:repositoryId, :userId) FROM DUAL", nativeQuery = true)
    String fnEstadoColaboradorRepo(@Param("repositoryId") Long repositoryId, @Param("userId") Long userId);

    @Query(value = "SELECT PKG_REPOSITORIOS.fn_es_colaborador_aceptado(:repositoryId, :userId) FROM DUAL", nativeQuery = true)
    int fnEsColaboradorAceptado(@Param("repositoryId") Long repositoryId, @Param("userId") Long userId);

    @Query(value = "SELECT PKG_REPOSITORIOS.fn_obtener_colaborador_id(:repositoryId, :userId) FROM DUAL", nativeQuery = true)
    Long fnObtenerColaboradorId(@Param("repositoryId") Long repositoryId, @Param("userId") Long userId);

    @Query(value = "SELECT PKG_REPOSITORIOS.fn_obtener_colab_por_username(:repositoryId, :username) FROM DUAL", nativeQuery = true)
    Long fnObtenerColabPorUsername(@Param("repositoryId") Long repositoryId, @Param("username") String username);
}
