package com.backend.repository;

import com.backend.domain.identity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    @Query(value = "SELECT PKG_AUTH_USUARIOS.fn_obtener_rol_por_nombre(:name) FROM DUAL", nativeQuery = true)
    Long fnObtenerRolPorNombre(@Param("name") String name);

    default Optional<Role> findByName(String name) {
        Long id = fnObtenerRolPorNombre(name);
        return id == null ? Optional.empty() : findById(id);
    }
}
