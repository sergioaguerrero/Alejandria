package com.backend.repository;

import com.backend.domain.ai.AiShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiShareRepository extends JpaRepository<AiShare, Long> {

    @Query("""
            SELECT s FROM AiShare s
            JOIN FETCH s.recipient r
            WHERE s.material.id = :materialId
              AND s.sender.id = :senderId
            ORDER BY LOWER(r.username) ASC
            """)
    List<AiShare> findByMaterialIdAndSenderId(@Param("materialId") Long materialId, @Param("senderId") Long senderId);

    @Query("""
            SELECT s FROM AiShare s
            JOIN FETCH s.sender
            WHERE s.material.id = :materialId
              AND s.recipient.id = :recipientId
            """)
    Optional<AiShare> findByMaterialIdAndRecipientId(
            @Param("materialId") Long materialId,
            @Param("recipientId") Long recipientId
    );

    @Query("""
            SELECT s FROM AiShare s
            JOIN FETCH s.material m
            JOIN FETCH m.owner
            LEFT JOIN FETCH m.studyRepository
            JOIN FETCH s.sender
            WHERE s.recipient.id = :recipientId
            ORDER BY s.sharedAt DESC
            """)
    List<AiShare> findSharedWithRecipient(@Param("recipientId") Long recipientId);
}
