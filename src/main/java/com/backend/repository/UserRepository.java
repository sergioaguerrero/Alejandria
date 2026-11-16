package com.backend.repository;

import com.backend.domain.identity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByInstitutionalEmail(String institutionalEmail);

    boolean existsByInstitutionalEmail(String institutionalEmail);

    boolean existsByUsername(String username);

    int deleteByVerifiedFalseAndRegistrationDateBefore(LocalDateTime cutoff);
}
