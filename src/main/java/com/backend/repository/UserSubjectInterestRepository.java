package com.backend.repository;

import com.backend.domain.identity.UserSubjectInterest;
import com.backend.domain.identity.UserSubjectInterestId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserSubjectInterestRepository extends JpaRepository<UserSubjectInterest, UserSubjectInterestId> {
}
