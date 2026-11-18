package com.backend.repository;

import com.backend.domain.identity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByUsernameIgnoreCase(String username);

    Optional<User> findByInstitutionalEmail(String institutionalEmail);

    Optional<User> findByInstitutionalEmailIgnoreCase(String institutionalEmail);

    boolean existsByInstitutionalEmail(String institutionalEmail);

    boolean existsByUsername(String username);

    boolean existsByUsernameIgnoreCaseAndIdNot(String username, Long id);

    @Query("""
            SELECT u FROM User u
            LEFT JOIN FETCH u.role r
            WHERE u.verified = true
              AND u.suspended = false
            ORDER BY LOWER(u.username) ASC
            """)
    List<User> findVerifiedUsers();

    @Query("""
            SELECT u FROM User u
            LEFT JOIN FETCH u.role r
            WHERE u.verified = true
              AND u.suspended = false
              AND (r IS NULL OR LOWER(r.name) NOT LIKE '%admin%' ESCAPE '\\')
              AND (:queryPattern IS NULL
                   OR LOWER(u.username) LIKE :queryPattern ESCAPE '\\'
                   OR (:semester IS NOT NULL AND u.semester = :semester))
            ORDER BY LOWER(u.username) ASC
            """)
    List<User> searchActiveStudents(
            @Param("queryPattern") String queryPattern,
            @Param("semester") Integer semester,
            Pageable pageable
    );

    @Query("""
            SELECT u FROM User u
            JOIN FETCH u.role r
            WHERE u.verified = true
              AND u.suspended = false
              AND LOWER(r.name) LIKE '%admin%' ESCAPE '\\'
            ORDER BY u.id ASC
            """)
    List<User> findVerifiedAdmins();

    int deleteByVerifiedFalseAndRegistrationDateBefore(LocalDateTime cutoff);
}
