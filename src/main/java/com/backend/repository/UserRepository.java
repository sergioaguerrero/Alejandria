package com.backend.repository;

import com.backend.domain.identity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @Query(value = "SELECT PKG_AUTH_USUARIOS.fn_usuario_puede_acceder(:userId) FROM DUAL", nativeQuery = true)
    int fnUsuarioPuedeAcceder(@Param("userId") Long userId);

    @Query(value = "SELECT PKG_AUTH_USUARIOS.fn_contar_estudiantes_activos() FROM DUAL", nativeQuery = true)
    long fnContarEstudiantesActivos();

    @Query(value = "SELECT PKG_AUTH_USUARIOS.fn_buscar_usuario_por_username(:username) FROM DUAL", nativeQuery = true)
    Long fnBuscarUsuarioPorUsername(@Param("username") String username);

    @Query(value = "SELECT PKG_AUTH_USUARIOS.fn_buscar_usuario_por_correo(:email) FROM DUAL", nativeQuery = true)
    Long fnBuscarUsuarioPorCorreo(@Param("email") String email);

    @Query(value = "SELECT PKG_AUTH_USUARIOS.fn_existe_username_otro(:username, :excludeId) FROM DUAL", nativeQuery = true)
    int fnExisteUsernameOtro(@Param("username") String username, @Param("excludeId") Long excludeId);

    default Optional<User> findByInstitutionalEmail(String email) {
        Long id = fnBuscarUsuarioPorCorreo(email);
        return id == null ? Optional.empty() : findById(id);
    }
}
