package com.backend.domain.identity;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "ROL")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre", nullable = false, unique = true, length = 150)
    private String name;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "PERMISO_ROL", joinColumns = @JoinColumn(name = "rol_id"))
    @Column(name = "permiso", nullable = false, length = 100)
    private Set<String> permissions = new HashSet<>();

    protected Role() {
    }

    public Role(String name, Set<String> permissions) {
        this.name = name;
        this.permissions = permissions;
    }

    public Long getId() {return id;}

    public String getName() {return name;}

    public void setName(String name) {this.name = name;}

    public Set<String> getPermissions() {return permissions;}

    public void setPermissions(Set<String> permissions) {this.permissions = permissions;}
}
