package com.backend.repository;

import com.backend.domain.identity.UserFollow;
import com.backend.domain.identity.UserFollowId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserFollowRepository extends JpaRepository<UserFollow, UserFollowId> {

    @Query(value = "SELECT PKG_AUTH_USUARIOS.fn_son_amigos_mutuos(:user1Id, :user2Id) FROM DUAL", nativeQuery = true)
    int fnSonAmigosMutuos(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);

    @Query(value = "SELECT PKG_AUTH_USUARIOS.fn_es_seguidor_usuario(:followerId, :followedId) FROM DUAL", nativeQuery = true)
    int fnEsSeguidorUsuario(@Param("followerId") Long followerId, @Param("followedId") Long followedId);

    @Query(value = "SELECT PKG_AUTH_USUARIOS.fn_contar_seguidores_usuario(:userId) FROM DUAL", nativeQuery = true)
    long fnContarSeguidoresUsuario(@Param("userId") Long userId);

    @Query(value = "SELECT PKG_AUTH_USUARIOS.fn_contar_seguidos_usuario(:userId) FROM DUAL", nativeQuery = true)
    long fnContarSeguidosUsuario(@Param("userId") Long userId);
}
