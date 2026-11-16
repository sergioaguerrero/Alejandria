package com.backend.repository;

import com.backend.domain.identity.UserFollow;
import com.backend.domain.identity.UserFollowId;
import com.backend.domain.identity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface UserFollowRepository extends JpaRepository<UserFollow, UserFollowId> {

    @Query("SELECT uf.id.followedId, COUNT(uf) FROM UserFollow uf WHERE uf.id.followedId IN :userIds GROUP BY uf.id.followedId")
    List<Object[]> countFollowersByUserIds(@Param("userIds") Collection<Long> userIds);

    @Query("SELECT uf.id.followerId, COUNT(uf) FROM UserFollow uf WHERE uf.id.followerId IN :userIds GROUP BY uf.id.followerId")
    List<Object[]> countFollowingByUserIds(@Param("userIds") Collection<Long> userIds);

    @Query("SELECT uf.id.followedId FROM UserFollow uf WHERE uf.id.followerId = :viewerId AND uf.id.followedId IN :userIds")
    List<Long> findFollowedUserIds(@Param("viewerId") Long viewerId, @Param("userIds") Collection<Long> userIds);

    @Query("SELECT uf.id.followerId FROM UserFollow uf WHERE uf.id.followedId = :viewerId AND uf.id.followerId IN :userIds")
    List<Long> findFollowerUserIds(@Param("viewerId") Long viewerId, @Param("userIds") Collection<Long> userIds);

    @Query("""
            SELECT u FROM User u
            JOIN UserFollow uf ON uf.id.followedId = u.id
            WHERE uf.id.followerId = :viewerId
              AND u.verified = true
            ORDER BY LOWER(u.username) ASC
            """)
    List<User> findFollowingUsers(@Param("viewerId") Long viewerId);

    @Query("""
            SELECT u FROM User u
            JOIN UserFollow uf ON uf.id.followerId = u.id
            WHERE uf.id.followedId = :viewerId
              AND u.verified = true
            ORDER BY LOWER(u.username) ASC
            """)
    List<User> findFollowerUsers(@Param("viewerId") Long viewerId);

    @Query("""
            SELECT u FROM User u
            JOIN UserFollow uf1 ON uf1.id.followedId = u.id
            JOIN UserFollow uf2 ON uf2.id.followerId = u.id AND uf2.id.followedId = :viewerId
            WHERE uf1.id.followerId = :viewerId
              AND u.verified = true
            ORDER BY LOWER(u.username) ASC
            """)
    List<User> findMutualFriends(@Param("viewerId") Long viewerId);
}
