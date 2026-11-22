package com.backend.repository;

import com.backend.domain.repos.StudyRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StudyRepositoryRepository extends JpaRepository<StudyRepository, Long> {

    @Query(value = "SELECT PKG_REPOSITORIOS.fn_contar_repos_autor(:authorId) FROM DUAL", nativeQuery = true)
    long fnContarReposAutor(@Param("authorId") Long authorId);

    @Query(value = "SELECT PKG_REPOSITORIOS.fn_contar_total_repositorios() FROM DUAL", nativeQuery = true)
    long fnContarTotalRepositorios();
}
