package com.backend.domain.repository;
import jakarta.persistence.*;

@Entity
@Table(name = "TAG")
public class Tag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false,unique = true, length = 60)
    private String name;

    protected Tag (){}

    public Tag(String name) {this.name = name;}

    public Long getId() {return id;}

    public String getName() {return name;}

    public void setName(String name) {this.name = name;}
}
