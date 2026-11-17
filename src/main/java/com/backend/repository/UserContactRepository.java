package com.backend.repository;

import com.backend.domain.identity.UserContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface UserContactRepository extends JpaRepository<UserContact, Long> {

    List<UserContact> findByUserIdOrderByDisplayOrderAscIdAsc(Long userId);

    List<UserContact> findByUserIdInOrderByDisplayOrderAscIdAsc(Collection<Long> userIds);

    @Modifying
    void deleteByUserId(Long userId);
}
