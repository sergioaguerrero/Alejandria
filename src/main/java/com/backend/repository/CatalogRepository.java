package com.backend.repository;

import com.backend.domain.academy.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CatalogRepository extends JpaRepository<Subject, Long> {

    @Query("SELECT m FROM Subject m JOIN FETCH m.semester ORDER BY m.semester.number ASC, m.name ASC")
    List<Subject> findAllSubject();

    @Query("SELECT m FROM Subject m JOIN FETCH m.semester WHERE m.semester.id = :semesterId ORDER BY m.name ASC")
    List<Subject> findSubjectBySemester(@Param("semesterId") Long semesterId);

    @Query("SELECT m FROM Subject m JOIN FETCH m.semester WHERE m.semester.number = :semesterNumber ORDER BY m.name ASC")
    List<Subject> findSubjectBySemesterNumber(@Param("semesterNumber") int semesterNumber);

    @Query("SELECT m FROM Subject m JOIN FETCH m.semester WHERE m.id = :id")
    Optional<Subject> findByIdWithSemester(@Param("id") Long id);
}
