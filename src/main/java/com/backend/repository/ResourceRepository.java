package com.backend.repository;

import com.backend.domain.repos.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    @Query(value = "SELECT PKG_REPOSITORIOS.fn_contar_recursos_publicados(:repositoryId) FROM DUAL", nativeQuery = true)
    int fnContarRecursosPublicados(@Param("repositoryId") Long repositoryId);

    @Query(value = "SELECT PKG_REPOSITORIOS.fn_contar_recursos_autor(:authorId) FROM DUAL", nativeQuery = true)
    long fnContarRecursosAutor(@Param("authorId") Long authorId);
}
