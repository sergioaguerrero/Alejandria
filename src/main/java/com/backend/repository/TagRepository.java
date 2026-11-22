package com.backend.repository;

import com.backend.domain.repos.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {

    @Query(value = "SELECT PKG_REPOSITORIOS.fn_obtener_etiqueta_nombre(:name) FROM DUAL", nativeQuery = true)
    Long fnObtenerEtiquetaNombre(@Param("name") String name);
}
