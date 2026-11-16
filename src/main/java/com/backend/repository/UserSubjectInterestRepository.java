package com.backend.repository;

import com.backend.domain.academy.Subject;
import com.backend.domain.identity.UserSubjectInterest;
import com.backend.domain.identity.UserSubjectInterestId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserSubjectInterestRepository extends JpaRepository<UserSubjectInterest, UserSubjectInterestId> {

    @Query("""
            SELECT s FROM Subject s
            JOIN FETCH s.semester
            JOIN UserSubjectInterest umi ON umi.id.subjectId = s.id
            WHERE umi.id.userId = :userId
            ORDER BY s.semester.number ASC, s.name ASC
            """)
    List<Subject> findSubjectsByUserId(@Param("userId") Long userId);

    void deleteByIdUserId(Long userId);
}
