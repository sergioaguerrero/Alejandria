package com.backend.domain.academy;

import jakarta.persistence.*;
@Entity
@Table(name = "PROGRAMA")
public  class Program {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre", nullable = false, length = 80)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "facultad_id")

    private Faculty faculty;
    protected Program() {}

    public Program(String name, Faculty faculty) {
        this.name = name;
        this.faculty = faculty;
    }

    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Faculty getFaculty() { return faculty; }
    public void setFaculty(Faculty faculty) { this.faculty = faculty; }
}