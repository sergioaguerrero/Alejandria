package com.backend.dto;

import java.util.List;

public class UpdateProfileRequest {

    private String name;
    private String username;
    private Integer semester;
    private String bio;
    private List<ContactItemRequest> contacts;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public List<ContactItemRequest> getContacts() { return contacts; }
    public void setContacts(List<ContactItemRequest> contacts) { this.contacts = contacts; }
}
