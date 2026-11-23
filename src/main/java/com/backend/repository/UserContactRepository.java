package com.backend.repository;

import com.backend.domain.identity.UserContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface UserContactRepository extends JpaRepository<UserContact, Long> {

    @Query("SELECT c FROM UserContact c WHERE c.user.id IN :userIds ORDER BY c.displayOrder ASC, c.id ASC")
    List<UserContact> findAllByUserIdsOrdered(@Param("userIds") Collection<Long> userIds);
}
