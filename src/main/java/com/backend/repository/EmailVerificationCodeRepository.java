package com.backend.repository;

import com.backend.domain.identity.EmailVerificationCode;
import com.backend.domain.identity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailVerificationCodeRepository extends JpaRepository<EmailVerificationCode, Long> {

    Optional<EmailVerificationCode> findTopByUserAndUsedFalseOrderByCreatedAtDesc(User user);
}
