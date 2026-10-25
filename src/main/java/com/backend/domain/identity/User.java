package com.backend.domain.identity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "USER")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String username;

    @Column(nullable = false, length = 150)
    private String first_name;

    @Column(nullable = false, length = 150)
    private String second_name;

    @Column(nullable = false, length = 150)
    private String first_lastname;

    @Column(nullable = false, length = 150)
    private String second_lastname;

    @Column(nullable = false, length = 150)
    private String institutionalEmail;

    @Column(nullable = false, length = 150)
    private String passwordHash;

    @Column(nullable = false)
    private boolean verified;

    @Column(name = "registration_date", nullable = false)
    private LocalDateTime registrationDate;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id")
    private Role role;

    protected User (){}

    public User(String username, String first_name, String second_name, String first_lastname, String second_lastname, String institutionalEmail, String passwordHash, boolean verified, LocalDateTime registrationDate) {
        this.username = username;
        this.first_name = first_name;
        this.second_name = second_name;
        this.first_lastname = first_lastname;
        this.second_lastname = second_lastname;
        this.institutionalEmail = institutionalEmail;
        this.passwordHash = passwordHash;
        this.verified = false;
        this.registrationDate = LocalDateTime.now();
    }

    public Long getId() {return id;}

    public String getUsername() {return username;}

    public void setUsername(String username) {this.username = username;}

    public String getFirst_name() {return first_name;}

    public void setFirst_name(String first_name) {this.first_name = first_name;}

    public String getSecond_name() {return second_name;}

    public void setSecond_name(String second_name) {this.second_name = second_name;}

    public String getFirst_lastname() {return first_lastname;}

    public void setFirst_lastname(String first_lastname) {this.first_lastname = first_lastname;}

    public String getSecond_lastname() {return second_lastname;}

    public void setSecond_lastname(String second_lastname) {this.second_lastname = second_lastname;}

    public String getInstitutionalEmail() {return institutionalEmail;}

    public void setInstitutionalEmail(String institutionalEmail) {this.institutionalEmail = institutionalEmail;}

    public String getPasswordHash() {return passwordHash;}

    public void setPasswordHash(String passwordHash) {this.passwordHash = passwordHash;}

    public boolean isVerified() {return verified;}

    public void setVerified(boolean verified) {this.verified = verified;}

    public LocalDateTime getRegistrationDate() {return registrationDate;}

    public Role getRole() {return role;}

    public void setRole(Role role) {this.role = role;}
}
