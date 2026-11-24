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

    Optional<User> findByInstitutionalEmail(String institutionalEmail);
}
