package com.backend.repository;

import com.backend.domain.academy.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CatalogRepository extends JpaRepository<Subject, Long> {

    @Query("SELECT m FROM Subject m ORDER BY m.name")
    List<Subject> findAllSubject();

    @Query("SELECT m FROM Subject m WHERE m.semester.id = :semesterId ORDER BY m.name")
    List<Subject> findSubjectBySemester(@Param("semesterId") Long semesterId);
}
