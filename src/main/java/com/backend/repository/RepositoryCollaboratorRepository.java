package com.backend.repository;

import com.backend.domain.repos.RepositoryCollaborator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface RepositoryCollaboratorRepository extends JpaRepository<RepositoryCollaborator, Long> {

    @Query("""
            SELECT c FROM RepositoryCollaborator c
            JOIN FETCH c.user u
            LEFT JOIN FETCH u.role
            JOIN FETCH c.invitedBy
            JOIN FETCH c.studyRepository r
            JOIN FETCH r.subject s
            JOIN FETCH s.semester
            JOIN FETCH r.author a
            LEFT JOIN FETCH a.role
            WHERE c.id IN :ids
            """)
    List<RepositoryCollaborator> findAllWithDetailsByIdIn(@Param("ids") Collection<Long> ids);
}
