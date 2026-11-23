package com.backend.repository;

import com.backend.domain.repos.StudyRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudyRepositoryRepository extends JpaRepository<StudyRepository, Long> {

    @Query("SELECT r FROM StudyRepository r JOIN FETCH r.subject s JOIN FETCH s.semester JOIN FETCH r.author a LEFT JOIN FETCH a.role WHERE r.id = :id")
    Optional<StudyRepository> findWithDetailsById(@Param("id") Long id);

    @Query("SELECT r FROM StudyRepository r JOIN FETCH r.subject s JOIN FETCH s.semester JOIN FETCH r.author a LEFT JOIN FETCH a.role WHERE r.id IN :ids")
    List<StudyRepository> findAllWithDetailsByIdIn(@Param("ids") Collection<Long> ids);

    @Query(value = """
            SELECT r.id,
                   PKG_REPOSITORIOS.fn_contar_recursos_publicados(r.id),
                   PKG_REPOSITORIOS.fn_contar_seguidores_repo(r.id)
            FROM REPOSITORIO_ESTUDIO r
            WHERE r.id IN (:repoIds)
            """, nativeQuery = true)
    List<Object[]> findPublicMetricsByIdIn(@Param("repoIds") Collection<Long> repoIds);

    @Query(value = """
            SELECT r.id,
                   PKG_REPOSITORIOS.fn_contar_recursos_publicados(r.id),
                   PKG_REPOSITORIOS.fn_contar_seguidores_repo(r.id),
                   PKG_REPOSITORIOS.fn_usuario_dio_like_repo(r.id, :viewerId),
                   PKG_REPOSITORIOS.fn_usuario_sigue_repo(r.id, :viewerId),
                   PKG_REPOSITORIOS.fn_estado_colaborador_repo(r.id, :viewerId)
            FROM REPOSITORIO_ESTUDIO r
            WHERE r.id IN (:repoIds)
            """, nativeQuery = true)
    List<Object[]> findViewerMetricsByIdIn(@Param("repoIds") Collection<Long> repoIds, @Param("viewerId") Long viewerId);

    @Query(value = "SELECT PKG_REPOSITORIOS.fn_contar_repos_autor(:authorId) FROM DUAL", nativeQuery = true)
    long fnContarReposAutor(@Param("authorId") Long authorId);

    @Query(value = "SELECT PKG_REPOSITORIOS.fn_contar_total_repositorios() FROM DUAL", nativeQuery = true)
    long fnContarTotalRepositorios();
}
