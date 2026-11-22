package com.backend.repository;

import com.backend.domain.identity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query(value = "SELECT PKG_AUTH_USUARIOS.fn_contar_notif_no_leidas(:userId) FROM DUAL", nativeQuery = true)
    long fnContarNotifNoLeidas(@Param("userId") Long userId);

    @Query(value = "SELECT PKG_AUTH_USUARIOS.fn_obtener_notificacion_usr(:notificationId, :userId) FROM DUAL", nativeQuery = true)
    Long fnObtenerNotificacionUsr(@Param("notificationId") Long notificationId, @Param("userId") Long userId);
}
