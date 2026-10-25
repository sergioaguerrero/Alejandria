package com.backend.repository;

import com.backend.domain.analytic.Interaction;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    List<Interaction> findByDateBetween(LocalDateTime from, LocalDateTime to);
}