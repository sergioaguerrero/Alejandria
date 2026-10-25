package com.backend.domain.academy;

import jakarta.persistence.*;

@Entity
@Table(name = "SEMESTER")
public class Semester {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "semester_number",nullable = false)
    private int number;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "program_id")
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
