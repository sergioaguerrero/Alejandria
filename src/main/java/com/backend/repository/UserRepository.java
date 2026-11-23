package com.backend.repository;

import com.backend.domain.identity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role WHERE u.id = :id")
    Optional<User> findWithRoleById(@Param("id") Long id);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role WHERE u.id IN :ids")
    List<User> findAllWithRoleByIdIn(@Param("ids") Collection<Long> ids);

    @Query(value = """
            SELECT u.id,
                   PKG_AUTH_USUARIOS.fn_contar_seguidores_usuario(u.id),
                   PKG_AUTH_USUARIOS.fn_contar_seguidos_usuario(u.id)
            FROM USUARIO u
            WHERE u.id IN (:userIds)
            """, nativeQuery = true)
    List<Object[]> findPublicFollowMetricsByIdIn(@Param("userIds") Collection<Long> userIds);

    @Query(value = """
            SELECT u.id,
                   PKG_AUTH_USUARIOS.fn_contar_seguidores_usuario(u.id),
                   PKG_AUTH_USUARIOS.fn_contar_seguidos_usuario(u.id),
                   PKG_AUTH_USUARIOS.fn_es_seguidor_usuario(:viewerId, u.id),
                   PKG_AUTH_USUARIOS.fn_es_seguidor_usuario(u.id, :viewerId)
            FROM USUARIO u
            WHERE u.id IN (:userIds)
            """, nativeQuery = true)
    List<Object[]> findViewerFollowMetricsByIdIn(@Param("userIds") Collection<Long> userIds, @Param("viewerId") Long viewerId);

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
