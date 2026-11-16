package com.backend.domain.governance;

import com.backend.domain.identity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "REGISTRO_AUDITORIA")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre_accion", nullable = false, length = 100)
    private String action;

    @Column(name = "nombre_entidad", nullable = false, length = 100)
    private String entity;

    @Column(name = "entidad_id")
    private Long entityId;

    @Column(name = "fecha_evento", nullable = false)
    private LocalDateTime date;

    @Column(name = "ip_origen", length = 45)
    private String originIp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private User user;

    protected AuditLog() {}

    public AuditLog(String action, String entity, Long entityId, String originIp, User user) {
        this.action = action;
        this.entity = entity;
        this.entityId = entityId;
        this.originIp = originIp;
        this.user = user;
        this.date = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getAction() { return action; }
    public String getEntity() { return entity; }
    public Long getEntityId() { return entityId; }
    public LocalDateTime getDate() { return date; }
    public String getOriginIp() { return originIp; }
    public User getUser() { return user; }
}