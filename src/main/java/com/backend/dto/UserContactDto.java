package com.backend.dto;

import com.backend.domain.identity.UserContact;

public class UserContactDto {

    private Long id;
    private String type;
    private String value;
    private String label;

    public UserContactDto() {}

    public UserContactDto(Long id, String type, String value, String label) {
        this.id = id;
        this.type = type;
        this.value = value;
        this.label = label;
    }

    public static UserContactDto fromEntity(UserContact entity) {
        return new UserContactDto(
                entity.getId(),
                entity.getType() != null ? entity.getType().name() : null,
                entity.getValue(),
                entity.getLabel()
        );
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
}
