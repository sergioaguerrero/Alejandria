package com.backend.repository;

import com.backend.domain.academy.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CatalogRepository extends JpaRepository<Subject, Long> {
}
