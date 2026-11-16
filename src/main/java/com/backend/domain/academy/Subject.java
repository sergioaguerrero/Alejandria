package com.backend.domain.academy;

import jakarta.persistence.*;

@Entity
@Table(name = "MATERIA")

public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo", nullable = false, length = 150)
    private String code;

    @Column(name = "nombre", nullable = false, length = 150)
    private String name;

    @Column(name = "creditos", nullable = false)
    private int credits;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "semestre_id")
    private Semester semester;

    protected Subject() {}

    public Subject(String code, String name, int credits, Semester semester) {
        this.code = code;
        this.name = name;
        this.credits = credits;
        this.semester = semester;
    }

    public Long getId() {return id;}

    public String getCode() {return code;}

    public void setCode(String code) {this.code = code;}

    public String getName() {return name;}

    public void setName(String name) {this.name = name;}

    public int getCredits() {return credits;}

    public void setCredits(int credits) {this.credits = credits;}

    public Semester getSemester() {return semester;}

    public void setSemester(Semester semester) {this.semester = semester;}
}
