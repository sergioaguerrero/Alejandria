package com.backend.repository;

import com.backend.domain.identity.PasswordResetToken;
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
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE PasswordResetToken t SET t.used = true WHERE t.user = :user AND t.used = false")
    int invalidateActiveTokensByUser(@Param("user") User user);

    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiresAt < :cutoff OR (t.used = true AND t.createdAt < :cutoff)")
    int deleteExpiredOrUsedBefore(@Param("cutoff") LocalDateTime cutoff);
}
