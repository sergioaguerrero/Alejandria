package com.backend.repository;

import com.backend.domain.identity.EmailVerificationCode;
import com.backend.domain.identity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailVerificationCodeRepository extends JpaRepository<EmailVerificationCode, Long> {

    @Query(value = "SELECT PKG_AUTH_USUARIOS.fn_obtener_ultimo_otp_activo(:userId) FROM DUAL", nativeQuery = true)
    Long fnObtenerUltimoOtpActivo(@Param("userId") Long userId);

    default Optional<EmailVerificationCode> findTopByUserAndUsedFalseOrderByCreatedAtDesc(User user) {
        if (user == null || user.getId() == null) {
            return Optional.empty();
        }
        Long id = fnObtenerUltimoOtpActivo(user.getId());
        return id == null ? Optional.empty() : findById(id);
    }
}
