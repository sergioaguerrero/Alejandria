package com.backend.dto;

public class ContactItemRequest {

    private String type;
    private String value;
    private String label;

    public ContactItemRequest() {}

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
}
