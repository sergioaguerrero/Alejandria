package com.backend.repository;

import com.backend.domain.analytic.Interaction;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

public interface InteractionRepository extends JpaRepository<Interaction, Long> {

    @Query("""
        select i.subject.id, i.type, count(i)
        from Interaction i
        where i.subject is not null and i.date between :from and :to
        group by i.subject.id, i.type
        """)
    List<Object[]> countBySubjectAndType(@Param("from") LocalDateTime from,
                                         @Param("to") LocalDateTime to);

    @Query("""
        select lower(i.searchTerm), count(i)
        from Interaction i
        where i.type = com.backend.cross.InteractionType.SEARCH
          and i.searchTerm is not null
        group by lower(i.searchTerm)
        order by count(i) desc
        """)
    List<Object[]> topSearchTerms(Pageable pageable);

    @Query("""
        select lower(i.searchTerm), count(i)
        from Interaction i
        where i.type = com.backend.cross.InteractionType.SEARCH
          and i.searchTerm is not null
          and i.date >= :from
        group by lower(i.searchTerm)
        order by count(i) desc
        """)
    List<Object[]> topSearchTermsSince(@Param("from") LocalDateTime from, Pageable pageable);

    @Query("""
        select i from Interaction i
        left join fetch i.resource r
        left join fetch r.studyRepository
        left join fetch i.subject
        where i.user.id = :userId
          and i.type in (com.backend.cross.InteractionType.VIEW, com.backend.cross.InteractionType.DOWNLOAD)
        order by i.date desc, i.id desc
        """)
    List<Interaction> findUserViewAndDownloadHistory(@Param("userId") Long userId);

    @Query("""
        select s.name, count(i)
        from Interaction i
        join i.subject s
        where i.user.id = :userId
          and i.type in (com.backend.cross.InteractionType.VIEW, com.backend.cross.InteractionType.DOWNLOAD)
        group by s.name
        order by count(i) desc
        """)
    List<Object[]> countUserConsultationsBySubject(@Param("userId") Long userId);

    @Query("""
        select i.type, i.date
        from Interaction i
        join i.resource r
        where r.uploadedBy.id = :authorId
          and i.date >= :from
          and i.type in (com.backend.cross.InteractionType.VIEW, com.backend.cross.InteractionType.DOWNLOAD)
        """)
    List<Object[]> findAuthorResourceActivitySince(@Param("authorId") Long authorId, @Param("from") LocalDateTime from);

    @Query("""
        select i.user.id, i.date
        from Interaction i
        where i.date >= :from
        order by i.date asc
        """)
    List<Object[]> findUserActivitySince(@Param("from") LocalDateTime from);

    List<Interaction> findByDateBetween(LocalDateTime from, LocalDateTime to);

    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Interaction i SET i.resource = null WHERE i.resource.id = :resourceId")
    int clearResourceReference(@Param("resourceId") Long resourceId);

    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE Interaction i
        SET i.resource = null
        WHERE i.resource.id IN (
            SELECT r.id FROM Resource r WHERE r.studyRepository.id = :repositoryId
        )
        """)
    int clearResourceReferencesByRepositoryId(@Param("repositoryId") Long repositoryId);
}
