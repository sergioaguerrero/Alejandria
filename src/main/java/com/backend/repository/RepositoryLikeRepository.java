package com.backend.repository;

import com.backend.domain.repos.RepositoryLike;
import com.backend.domain.repos.RepositoryReactionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RepositoryLikeRepository extends JpaRepository<RepositoryLike, RepositoryReactionId> {

    @Query(value = "SELECT PKG_REPOSITORIOS.fn_usuario_dio_like_repo(:repositoryId, :userId) FROM DUAL", nativeQuery = true)
    int fnUsuarioDioLikeRepo(@Param("repositoryId") Long repositoryId, @Param("userId") Long userId);
}
