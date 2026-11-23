package com.backend.domain.identity;

import com.backend.cross.ContactMethodType;
import jakarta.persistence.*;

/**
 * Medio de contacto público asociado al perfil de un usuario.
 */
@Entity
@Table(
        name = "CONTACTO_USUARIO",
        indexes = {
                @Index(name = "idx_contacto_usuario", columnList = "usuario_id, orden")
        }
)
public class UserContact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 30)
    private ContactMethodType type;

    @Column(name = "valor", nullable = false, length = 255)
    private String value;

    @Column(name = "etiqueta", length = 60)
    private String label;

    @Column(name = "orden", nullable = false)
    private int displayOrder;

    protected UserContact() {}

    public UserContact(User user, ContactMethodType type, String value, String label, int displayOrder) {
        this.user = user;
        this.type = type;
        this.value = value;
        this.label = label;
        this.displayOrder = displayOrder;
    }

    public Long getId() { return id; }

    public User getUser() { return user; }

    public ContactMethodType getType() { return type; }
    public void setType(ContactMethodType type) { this.type = type; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }
}
