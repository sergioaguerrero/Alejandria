package com.backend.repository;

import com.backend.domain.academy.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CatalogRepository extends JpaRepository<Subject, Long> {

    @Query("SELECT s FROM Subject s JOIN FETCH s.semester WHERE s.id IN :ids")
    List<Subject> findAllWithSemesterByIdIn(@Param("ids") Collection<Long> ids);

    @Query("SELECT s FROM Subject s JOIN FETCH s.semester WHERE s.id = :id")
    Optional<Subject> findWithSemesterById(@Param("id") Long id);
}
