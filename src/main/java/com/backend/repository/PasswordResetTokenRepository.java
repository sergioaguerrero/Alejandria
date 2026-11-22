package com.backend.repository;

import com.backend.domain.identity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    @Query(value = "SELECT PKG_AUTH_USUARIOS.fn_obtener_token_reset_hash(:tokenHash) FROM DUAL", nativeQuery = true)
    Long fnObtenerTokenResetHash(@Param("tokenHash") String tokenHash);
}
