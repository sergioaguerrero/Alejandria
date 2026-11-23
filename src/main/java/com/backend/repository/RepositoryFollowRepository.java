package com.backend.repository;

import com.backend.domain.repos.RepositoryFollow;
import com.backend.domain.repos.RepositoryReactionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RepositoryFollowRepository extends JpaRepository<RepositoryFollow, RepositoryReactionId> {

    @Query(value = "SELECT PKG_REPOSITORIOS.fn_contar_seguidores_repo(:repositoryId) FROM DUAL", nativeQuery = true)
    long fnContarSeguidoresRepo(@Param("repositoryId") Long repositoryId);

    @Query(value = "SELECT PKG_REPOSITORIOS.fn_usuario_sigue_repo(:repositoryId, :userId) FROM DUAL", nativeQuery = true)
    int fnUsuarioSigueRepo(@Param("repositoryId") Long repositoryId, @Param("userId") Long userId);
}
