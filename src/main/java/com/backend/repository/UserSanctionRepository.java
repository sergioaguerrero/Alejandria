package com.backend.repository;

import com.backend.domain.governance.UserSanction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserSanctionRepository extends JpaRepository<UserSanction, Long> {

    @Query("""
            SELECT s FROM UserSanction s
            JOIN FETCH s.moderator
            WHERE s.user.id = :userId
            ORDER BY s.createdAt DESC, s.id DESC
            """)
    List<UserSanction> findByUserIdWithModeratorOrderByCreatedAtDesc(@Param("userId") Long userId);
}
