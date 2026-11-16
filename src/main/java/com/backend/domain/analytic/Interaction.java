package com.backend.domain.analytic;

import com.backend.cross.InteractionType;
import com.backend.domain.academy.Subject;
import com.backend.domain.identity.User;
import com.backend.domain.repos.Resource;   // ajusta si renombraste ese paquete
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "INTERACCION")
public class Interaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_interaccion", nullable = false, length = 20)
    private InteractionType type;

    @Column(name = "fecha_interaccion", nullable = false)
    private LocalDateTime date;

    @Column(name = "termino_busqueda", length = 200)
    private String searchTerm;

    @Column(name = "usuario_anonimo_id", nullable = false, length = 64)
    private String anonymousUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recurso_id")
    private Resource resource;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "materia_id")
    private Subject subject;

    protected Interaction() {}

    public Interaction(InteractionType type, String searchTerm, String anonymousUserId,
                       User user, Resource resource, Subject subject) {
        this.type = type;
        this.searchTerm = searchTerm;
        this.anonymousUserId = anonymousUserId;
        this.user = user;
        this.resource = resource;
        this.subject = subject;
        this.date = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public InteractionType getType() { return type; }
    public LocalDateTime getDate() { return date; }
    public String getSearchTerm() { return searchTerm; }
    public String getAnonymousUserId() { return anonymousUserId; }
    public User getUser() { return user; }
    public Resource getResource() { return resource; }
    public Subject getSubject() { return subject; }
}