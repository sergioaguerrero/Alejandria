package com.backend.domain.academy;

import jakarta.persistence.*;

@Entity
@Table(name = "SEMESTRE")
public class Semester {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_semestre", nullable = false)
    private int number;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "programa_id")
    private Program program;

    protected Semester() {}

    public Semester(int number, Program program) {
        this.number = number;
        this.program = program;
    }

    public Long getId() { return id; }

    public int getNumber() { return number; }
    public void setNumber(int number) { this.number = number; }

    public Program getProgram() { return program; }
    public void setProgram(Program program) { this.program = program; }
}
