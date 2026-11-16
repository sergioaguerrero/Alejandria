package com.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class RegisterRequest {

    @NotBlank(message = "El primer nombre es obligatorio.")
    private String first_name;

    private String second_name;

    @NotBlank(message = "El primer apellido es obligatorio.")
    private String first_lastname;

    @NotBlank(message = "El segundo apellido es obligatorio.")
    private String second_lastname;

    @NotBlank(message = "El nombre de usuario es obligatorio.")
    @Pattern(
            regexp = "^[a-zA-Z0-9._]{3,20}$",
            message = "Entre 3 y 20 caracteres: letras, números, punto o guion bajo."
    )
    private String username;

    @NotBlank(message = "El correo institucional es obligatorio.")
    @JsonAlias("institutionalEmail")
    private String email;

    @NotBlank(message = "La contraseña es requerida.")
    @JsonAlias("passwordHash")
    private String password;

    private Integer semester;

    public RegisterRequest() {}

    public String getFirst_name() { return first_name; }
    public void setFirst_name(String first_name) { this.first_name = first_name; }

    public String getSecond_name() { return second_name; }
    public void setSecond_name(String second_name) { this.second_name = second_name; }

    public String getFirst_lastname() { return first_lastname; }
    public void setFirst_lastname(String first_lastname) { this.first_lastname = first_lastname; }

    public String getSecond_lastname() { return second_lastname; }
    public void setSecond_lastname(String second_lastname) { this.second_lastname = second_lastname; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }
}
