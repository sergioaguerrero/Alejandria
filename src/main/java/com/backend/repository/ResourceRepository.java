package com.backend.repository;

import com.backend.domain.repos.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    @Query("""
            SELECT new com.backend.domain.repos.Resource(
                r.id, r.title, r.description, r.type, r.term, r.topic,
                r.fileName, r.mimeType, r.fileSizeBytes, r.uploadDate,
                r.status, r.totalViews, r.totalDownloads,
                u, s, sr
            )
            FROM Resource r
            LEFT JOIN r.uploadedBy u
            LEFT JOIN r.subject s
            LEFT JOIN r.studyRepository sr
            WHERE r.id IN :ids
            """)
    List<Resource> findAllMetadataByIdIn(@Param("ids") Collection<Long> ids);

    @Query("""
            SELECT r.id, t
            FROM Resource r
            JOIN r.tags t
            WHERE r.id IN :ids
            """)
    List<Object[]> findTagPairsByResourceIdIn(@Param("ids") Collection<Long> ids);

    @Query(value = "SELECT PKG_REPOSITORIOS.fn_contar_recursos_publicados(:repositoryId) FROM DUAL", nativeQuery = true)
    int fnContarRecursosPublicados(@Param("repositoryId") Long repositoryId);

    @Query(value = "SELECT PKG_REPOSITORIOS.fn_contar_recursos_autor(:authorId) FROM DUAL", nativeQuery = true)
    long fnContarRecursosAutor(@Param("authorId") Long authorId);
}
