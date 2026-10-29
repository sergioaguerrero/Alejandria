package com.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.backend.domain.identity.Role;
import org.springframework.stereotype.Repository;

import java.util.Optional;
@Repository

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> FindByName(String name);
}
