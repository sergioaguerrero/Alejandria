package com.backend.repository;

import com.backend.domain.governance.UserSanction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface UserSanctionRepository extends JpaRepository<UserSanction, Long> {

    @Query("SELECT s FROM UserSanction s JOIN FETCH s.moderator WHERE s.id IN :ids")
    List<UserSanction> findAllWithModeratorByIdIn(@Param("ids") Collection<Long> ids);
}
