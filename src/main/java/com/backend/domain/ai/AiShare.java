package com.backend.domain.ai;

import com.backend.domain.identity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "COMPARTIDO_IA")
public class AiShare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "material_id", nullable = false)
    private AiMaterial material;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "remitente_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "destinatario_id", nullable = false)
    private User recipient;

    @Column(name = "nota", length = 500)
    private String note;

    @Column(name = "fecha_compartido", nullable = false)
    private LocalDateTime sharedAt;

    protected AiShare() {
    }

    public AiShare(AiMaterial material, User sender, User recipient, String note) {
        this.material = material;
        this.sender = sender;
        this.recipient = recipient;
        this.note = note;
        this.sharedAt = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.sharedAt == null) {
            this.sharedAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }

    public AiMaterial getMaterial() { return material; }

    public User getSender() { return sender; }

    public User getRecipient() { return recipient; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public LocalDateTime getSharedAt() { return sharedAt; }
    public void setSharedAt(LocalDateTime sharedAt) { this.sharedAt = sharedAt; }
}
