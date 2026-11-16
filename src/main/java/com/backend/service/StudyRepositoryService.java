package com.backend.service;

import com.backend.domain.academy.Subject;
import com.backend.domain.identity.User;
import com.backend.domain.repos.RepositoryFollow;
import com.backend.domain.repos.RepositoryLike;
import com.backend.domain.repos.RepositoryReactionId;
import com.backend.domain.repos.Resource;
import com.backend.domain.repos.StudyRepository;
import com.backend.dto.RepositoryPageResponse;
import com.backend.dto.RepositoryRequestDto;
import com.backend.dto.RepositoryResponseDto;
import com.backend.exception.AuthException;
import com.backend.repository.CatalogRepository;
import com.backend.repository.RepositoryFollowRepository;
import com.backend.repository.RepositoryLikeRepository;
import com.backend.repository.ResourceRepository;
import com.backend.repository.StudyRepositoryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Lógica de negocio de repositorios de estudio persistidos en Oracle.
 */
@Service
public class StudyRepositoryService {

    private final StudyRepositoryRepository studyRepositoryRepository;
    private final CatalogRepository catalogRepository;
    private final ResourceRepository resourceRepository;
    private final RepositoryLikeRepository repositoryLikeRepository;
    private final RepositoryFollowRepository repositoryFollowRepository;

    public StudyRepositoryService(
            StudyRepositoryRepository studyRepositoryRepository,
            CatalogRepository catalogRepository,
            ResourceRepository resourceRepository,
            RepositoryLikeRepository repositoryLikeRepository,
            RepositoryFollowRepository repositoryFollowRepository
    ) {
        this.studyRepositoryRepository = studyRepositoryRepository;
        this.catalogRepository = catalogRepository;
        this.resourceRepository = resourceRepository;
        this.repositoryLikeRepository = repositoryLikeRepository;
        this.repositoryFollowRepository = repositoryFollowRepository;
    }

    @Transactional
    public RepositoryResponseDto create(RepositoryRequestDto dto, User currentUser) {
        User author = requireAuthenticated(currentUser, "Debes iniciar sesión para crear un repositorio.");
        Subject subject = resolveSubject(dto.getSubjectId());

        StudyRepository repo = new StudyRepository(
                dto.getName().trim(),
                dto.getDescription().trim(),
                subject,
                author
        );
        StudyRepository saved = studyRepositoryRepository.save(repo);
        return RepositoryResponseDto.fromEntity(saved, 0, false, false, 0L, true);
    }

    @Transactional(readOnly = true)
    public RepositoryPageResponse getAll(
            Long subjectId,
            Integer semester,
            String search,
            String order,
            int page,
            int size,
            User viewer
    ) {
        int safePage = Math.max(1, page);
        int safeSize = Math.min(Math.max(1, size), 50);
        Sort sort = resolveSort(order);
        PageRequest pageRequest = PageRequest.of(safePage - 1, safeSize, sort);

        String normalizedSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        Integer normalizedSemester = (semester != null && semester > 0) ? semester : null;

        Specification<StudyRepository> spec = buildFilterSpec(subjectId, normalizedSemester, normalizedSearch);
        Page<StudyRepository> result = studyRepositoryRepository.findAll(spec, pageRequest);

        List<RepositoryResponseDto> items = mapList(result.getContent(), viewer);
        return new RepositoryPageResponse(
                items,
                result.getTotalElements(),
                safePage,
                safeSize,
                Math.max(1, result.getTotalPages())
        );
    }

    @Transactional(readOnly = true)
    public RepositoryResponseDto getById(Long id, User viewer) {
        StudyRepository repo = findRepoOrThrow(id);
        return mapSingle(repo, viewer);
    }

    @Transactional(readOnly = true)
    public List<RepositoryResponseDto> getByAuthorUsername(String username, User viewer) {
        List<StudyRepository> list = studyRepositoryRepository.findByAuthorUsernameOrderByCreatedAtDesc(username);
        return mapList(list, viewer);
    }

    @Transactional
    public RepositoryResponseDto update(Long id, RepositoryRequestDto dto, User currentUser) {
        User user = requireAuthenticated(currentUser, "Debes iniciar sesión para editar este repositorio.");
        StudyRepository repo = findRepoOrThrow(id);
        requireOwner(repo, user, "Solo el dueño puede editar este repositorio.");

        Subject subject = resolveSubject(dto.getSubjectId());
        repo.setName(dto.getName().trim());
        repo.setDescription(dto.getDescription().trim());
        repo.setSubject(subject);

        StudyRepository saved = studyRepositoryRepository.save(repo);
        return mapSingle(saved, user);
    }

    @Transactional
    public void delete(Long id, User currentUser) {
        User user = requireAuthenticated(currentUser, "Debes iniciar sesión para eliminar este repositorio.");
        StudyRepository repo = findRepoOrThrow(id);
        requireOwner(repo, user, "Solo el dueño puede eliminar este repositorio.");

        repositoryLikeRepository.deleteByIdRepositoryId(id);
        repositoryFollowRepository.deleteByIdRepositoryId(id);
        studyRepositoryRepository.delete(repo);
    }

    @Transactional
    public Map<String, Object> toggleLike(Long id, User currentUser) {
        User user = requireAuthenticated(currentUser, "Inicia sesión para dar me gusta.");
        StudyRepository repo = findRepoOrThrow(id);

        RepositoryReactionId reactionId = new RepositoryReactionId(id, user.getId());
        boolean alreadyLiked = repositoryLikeRepository.existsById(reactionId);

        if (alreadyLiked) {
            repositoryLikeRepository.deleteById(reactionId);
            repo.setLikes(Math.max(0, repo.getLikes() - 1));
        } else {
            repositoryLikeRepository.save(new RepositoryLike(id, user.getId()));
            repo.setLikes(repo.getLikes() + 1);
        }

        studyRepositoryRepository.save(repo);
        return Map.of("liked", !alreadyLiked, "likes", repo.getLikes());
    }

    @Transactional
    public Map<String, Object> toggleFollow(Long id, User currentUser) {
        User user = requireAuthenticated(currentUser, "Inicia sesión para seguir este repositorio.");
        findRepoOrThrow(id);

        RepositoryReactionId reactionId = new RepositoryReactionId(id, user.getId());
        boolean alreadyFollowed = repositoryFollowRepository.existsById(reactionId);

        if (alreadyFollowed) {
            repositoryFollowRepository.deleteById(reactionId);
        } else {
            repositoryFollowRepository.save(new RepositoryFollow(id, user.getId()));
        }

        long followersCount = repositoryFollowRepository.countByIdRepositoryId(id);
        return Map.of("followed", !alreadyFollowed, "followersCount", followersCount);
    }

    @Transactional(readOnly = true)
    public List<RepositoryResponseDto> getFollowed(User currentUser) {
        User user = requireAuthenticated(currentUser, "Debes iniciar sesión para ver tus repositorios seguidos.");
        List<StudyRepository> followed = repositoryFollowRepository.findFollowedRepositoriesByUserId(user.getId());
        return mapList(followed, user);
    }

    @Transactional(readOnly = true)
    public List<Resource> listDocuments(Long repositoryId) {
        findRepoOrThrow(repositoryId);
        return resourceRepository.findByStudyRepositoryIdOrderByUploadDateDesc(repositoryId);
    }

    private StudyRepository findRepoOrThrow(Long id) {
        return studyRepositoryRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.NOT_FOUND,
                        "REPOSITORY_NOT_FOUND",
                        "El repositorio no existe o fue eliminado."
                ));
    }

    private Subject resolveSubject(Long subjectId) {
        return catalogRepository.findByIdWithSemester(subjectId)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.BAD_REQUEST,
                        "VALIDATION_ERROR",
                        "La materia seleccionada no existe.",
                        Map.of("subjectId", "Selecciona una materia válida.")
                ));
    }

    private User requireAuthenticated(User user, String message) {
        if (user == null) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", message);
        }
        return user;
    }

    private void requireOwner(StudyRepository repo, User user, String message) {
        if (repo.getAuthor() == null || !repo.getAuthor().getId().equals(user.getId())) {
            throw new AuthException(HttpStatus.FORBIDDEN, "FORBIDDEN", message);
        }
    }

    private Specification<StudyRepository> buildFilterSpec(Long subjectId, Integer semester, String search) {
        Specification<StudyRepository> spec = Specification.where(null);

        if (subjectId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("subject").get("id"), subjectId));
        }
        if (semester != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("subject").get("semester").get("number"), semester));
        }
        if (search != null) {
            String escaped = search.toLowerCase(Locale.ROOT)
                    .replace("\\", "\\\\")
                    .replace("%", "\\%")
                    .replace("_", "\\_");
            String pattern = "%" + escaped + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("name")), pattern, '\\'),
                    cb.like(cb.lower(root.get("description")), pattern, '\\'),
                    cb.like(cb.lower(root.get("subject").get("name")), pattern, '\\')
            ));
        }
        return spec;
    }

    private Sort resolveSort(String order) {
        if ("popular".equalsIgnoreCase(order)) {
            return Sort.by(Sort.Direction.DESC, "likes").and(Sort.by(Sort.Direction.DESC, "createdAt"));
        }
        if ("name".equalsIgnoreCase(order)) {
            return Sort.by(Sort.Direction.ASC, "name");
        }
        return Sort.by(Sort.Direction.DESC, "createdAt");
    }

    private RepositoryResponseDto mapSingle(StudyRepository repo, User viewer) {
        return mapList(List.of(repo), viewer).get(0);
    }

    private List<RepositoryResponseDto> mapList(List<StudyRepository> repositories, User viewer) {
        if (repositories.isEmpty()) {
            return List.of();
        }

        List<Long> ids = repositories.stream().map(StudyRepository::getId).toList();

        Map<Long, Integer> docCounts = new HashMap<>();
        for (Object[] row : resourceRepository.countByStudyRepositoryIds(ids)) {
            docCounts.put((Long) row[0], ((Long) row[1]).intValue());
        }

        Map<Long, Long> followerCounts = new HashMap<>();
        for (Object[] row : repositoryFollowRepository.countFollowersByRepositoryIds(ids)) {
            followerCounts.put((Long) row[0], (Long) row[1]);
        }

        Set<Long> likedIds = viewer != null
                ? new HashSet<>(repositoryLikeRepository.findLikedRepositoryIds(viewer.getId(), ids))
                : Collections.emptySet();

        Set<Long> followedIds = viewer != null
                ? new HashSet<>(repositoryFollowRepository.findFollowedRepositoryIds(viewer.getId(), ids))
                : Collections.emptySet();

        return repositories.stream()
                .map(repo -> {
                    boolean canUpload = viewer != null
                            && repo.getAuthor() != null
                            && repo.getAuthor().getId().equals(viewer.getId());
                    return RepositoryResponseDto.fromEntity(
                            repo,
                            docCounts.getOrDefault(repo.getId(), 0),
                            likedIds.contains(repo.getId()),
                            followedIds.contains(repo.getId()),
                            followerCounts.getOrDefault(repo.getId(), 0L),
                            canUpload
                    );
                })
                .toList();
    }
}
