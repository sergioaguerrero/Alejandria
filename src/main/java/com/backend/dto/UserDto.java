package com.backend.dto;

import com.backend.domain.identity.User;

public class UserDto {
    private Long id;
    private String name;
    private String username;
    private String email;
    private String first_name;
    private String second_name;
    private String first_lastname;
    private String second_lastname;
    private String role;
    private Integer semester;
    private boolean verified;

    public UserDto() {}

    public static UserDto fromEntity(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getInstitutionalEmail());
        dto.setFirst_name(user.getFirst_name());
        dto.setSecond_name(user.getSecond_name());
        dto.setFirst_lastname(user.getFirst_lastname());
        dto.setSecond_lastname(user.getSecond_lastname());
        dto.setSemester(user.getSemester());
        dto.setVerified(user.isVerified());

        String roleName = user.getRole() != null ? user.getRole().getName().toLowerCase() : "estudiante";
        dto.setRole(roleName.contains("admin") ? "admin" : "estudiante");
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirst_name() { return first_name; }
    public void setFirst_name(String first_name) { this.first_name = first_name; }

    public String getSecond_name() { return second_name; }
    public void setSecond_name(String second_name) { this.second_name = second_name; }

    public String getFirst_lastname() { return first_lastname; }
    public void setFirst_lastname(String first_lastname) { this.first_lastname = first_lastname; }

    public String getSecond_lastname() { return second_lastname; }
    public void setSecond_lastname(String second_lastname) { this.second_lastname = second_lastname; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }

    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }
}
