package com.backend.repository;

import com.backend.domain.repos.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    @Query("SELECT r.fileBytes FROM Resource r WHERE r.id = :id")
    Optional<byte[]> findFileBytesById(@Param("id") Long id);

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
}
