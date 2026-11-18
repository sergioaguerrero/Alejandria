package com.backend.domain.academy;

import jakarta.persistence.*;

@Entity
@Table(name = "FACULTAD")
public class Faculty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre", nullable = false, length = 80)
    private String name;

    protected Faculty() {}   // requerido por JPA

    public Faculty(String name) {
        this.name = name;
    }

    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
