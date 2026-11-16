package com.backend.dto;

import com.backend.domain.academy.Subject;

/**
 * DTO de salida para el catálogo de materias consumido por el frontend.
 */
public class SubjectDto {

    private Long id;
    private String code;
    private String name;
    private int credits;
    private Integer semester;

    public SubjectDto() {}

    public SubjectDto(Long id, String code, String name, int credits, Integer semester) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.credits = credits;
        this.semester = semester;
    }

    public static SubjectDto fromEntity(Subject subject) {
        Integer semesterNumber = subject.getSemester() != null ? subject.getSemester().getNumber() : null;
        return new SubjectDto(
                subject.getId(),
                subject.getCode(),
                subject.getName(),
                subject.getCredits(),
                semesterNumber
        );
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getCredits() { return credits; }
    public void setCredits(int credits) { this.credits = credits; }

    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }
}
