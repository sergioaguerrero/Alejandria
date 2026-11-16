package com.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Payload de entrada para crear o actualizar un repositorio de estudio.
 */
public class RepositoryRequestDto {

    @NotBlank(message = "El nombre debe tener al menos 3 caracteres.")
    @Size(min = 3, max = 200, message = "El nombre debe tener entre 3 y 200 caracteres.")
    private String name;

    @NotBlank(message = "Describe el repositorio en al menos 10 caracteres.")
    @Size(min = 10, max = 2000, message = "La descripción debe tener entre 10 y 2000 caracteres.")
    private String description;

    @NotNull(message = "Selecciona una materia.")
    private Long subjectId;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }
}
