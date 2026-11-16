package com.backend.repository;

import com.backend.domain.identity.EmailVerificationCode;
import com.backend.domain.identity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface EmailVerificationCodeRepository extends JpaRepository<EmailVerificationCode, Long> {

    Optional<EmailVerificationCode> findTopByUserAndUsedFalseOrderByCreatedAtDesc(User user);

    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE EmailVerificationCode c SET c.used = true WHERE c.user = :user AND c.used = false")
    int invalidateActiveCodesByUser(@Param("user") User user);

    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM EmailVerificationCode c WHERE c.expiresAt < :cutoff OR (c.used = true AND c.createdAt < :cutoff)")
    int deleteExpiredOrUsedBefore(@Param("cutoff") LocalDateTime cutoff);
}
