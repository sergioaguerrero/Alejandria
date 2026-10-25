package com.backend.domain.analytic;

import com.backend.cross.InteractionType;
import com.backend.domain.academy.Subject;
import com.backend.domain.identity.User;
import com.backend.domain.repository.Resource;   // ajusta si renombraste ese paquete
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "INTERACTION")
public class Interaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "interaction_type", nullable = false, length = 20)
    private InteractionType type;

    @Column(name = "interaction_date", nullable = false)
    private LocalDateTime date;

    @Column(name = "search_term", length = 200)
    private String searchTerm;

    @Column(name = "anonymous_user_id", nullable = false, length = 64)
    private String anonymousUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id")
    private Resource resource;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
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