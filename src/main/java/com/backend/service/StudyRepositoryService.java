package com.backend.service;

import com.backend.cross.NotificationType;
import com.backend.domain.academy.Subject;
import com.backend.domain.identity.User;
import com.backend.domain.repos.StudyRepository;
import com.backend.dto.RepositoryPageResponse;
import com.backend.dto.RepositoryRequestDto;
import com.backend.dto.RepositoryResponseDto;
import com.backend.exception.AuthException;
import com.backend.repository.CatalogRepository;
import com.backend.repository.RepositoryCollaboratorRepository;
import com.backend.repository.RepositoryFollowRepository;
import com.backend.repository.RepositoryLikeRepository;
import com.backend.repository.ResourceRepository;
import com.backend.repository.StudyRepositoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Lógica de negocio de repositorios de estudio delegando consultas, conteos,
 * reacciones (me gusta / seguimiento) y eliminación en cascada a PKG_REPOSITORIOS.
 */
@Service
public class StudyRepositoryService {

    private final StudyRepositoryRepository studyRepositoryRepository;
    private final CatalogRepository catalogRepository;
    private final ResourceRepository resourceRepository;
    private final RepositoryLikeRepository repositoryLikeRepository;
    private final RepositoryFollowRepository repositoryFollowRepository;
    private final RepositoryCollaboratorRepository repositoryCollaboratorRepository;
    private final NotificationService notificationService;
    private final OraclePackageService oraclePackageService;

    public StudyRepositoryService(
            StudyRepositoryRepository studyRepositoryRepository,
            CatalogRepository catalogRepository,
            ResourceRepository resourceRepository,
            RepositoryLikeRepository repositoryLikeRepository,
            RepositoryFollowRepository repositoryFollowRepository,
            RepositoryCollaboratorRepository repositoryCollaboratorRepository,
            NotificationService notificationService,
            OraclePackageService oraclePackageService
    ) {
        this.studyRepositoryRepository = studyRepositoryRepository;
        this.catalogRepository = catalogRepository;
        this.resourceRepository = resourceRepository;
        this.repositoryLikeRepository = repositoryLikeRepository;
        this.repositoryFollowRepository = repositoryFollowRepository;
        this.repositoryCollaboratorRepository = repositoryCollaboratorRepository;
        this.notificationService = notificationService;
        this.oraclePackageService = oraclePackageService;
    }

    @Transactional
    public RepositoryResponseDto create(RepositoryRequestDto dto, User currentUser) {
        User author = AuthGuards.requireAuthenticated(currentUser, "Debes iniciar sesión para crear un repositorio.");
        Subject subject = resolveSubject(dto.getSubjectId());

        StudyRepository repo = new StudyRepository(
                dto.getName().trim(),
                dto.getDescription().trim(),
                subject,
                author
        );
        StudyRepository saved = studyRepositoryRepository.save(repo);
        return RepositoryResponseDto.fromEntity(saved, 0, false, false, 0L, true, false, null);
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

        String normalizedSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        Integer normalizedSemester = (semester != null && semester > 0) ? semester : null;

        List<Long> allIds = oraclePackageService.fnBuscarRepositoriosIds(
                subjectId,
                normalizedSemester,
                normalizedSearch,
                order
        );

        long totalElements = allIds.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) totalElements / safeSize));
        int fromIndex = Math.min((safePage - 1) * safeSize, allIds.size());
        int toIndex = Math.min(fromIndex + safeSize, allIds.size());
        List<Long> pageIds = allIds.subList(fromIndex, toIndex);

        List<StudyRepository> pageEntities = oraclePackageService.orderByIds(
                pageIds,
                studyRepositoryRepository.findAllById(pageIds),
                StudyRepository::getId
        );

        List<RepositoryResponseDto> items = mapRepositories(pageEntities, viewer);
        return new RepositoryPageResponse(
                items,
                totalElements,
                safePage,
                safeSize,
                totalPages
        );
    }

    @Transactional(readOnly = true)
    public RepositoryResponseDto getById(Long id, User viewer) {
        StudyRepository repo = findRepoOrThrow(id);
        return mapSingle(repo, viewer);
    }

    @Transactional(readOnly = true)
    public List<RepositoryResponseDto> getByAuthorUsername(String username, User viewer) {
        List<Long> ids = oraclePackageService.fnRepositoriosPorAutorIds(username);
        List<StudyRepository> list = oraclePackageService.orderByIds(
                ids,
                studyRepositoryRepository.findAllById(ids),
                StudyRepository::getId
        );
        return mapRepositories(list, viewer);
    }

    @Transactional
    public RepositoryResponseDto update(Long id, RepositoryRequestDto dto, User currentUser) {
        User user = AuthGuards.requireAuthenticated(currentUser, "Debes iniciar sesión para editar este repositorio.");
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
        User user = AuthGuards.requireAuthenticated(currentUser, "Debes iniciar sesión para eliminar este repositorio.");
        StudyRepository repo = findRepoOrThrow(id);
        requireOwner(repo, user, "Solo el dueño puede eliminar este repositorio.");

        deleteRepositoryWithDependencies(id);
    }

    /**
     * Delega la eliminación en cascada del repositorio y sus dependencias
     * al procedimiento PKG_REPOSITORIOS.pr_eliminar_repositorio_cascada en Oracle.
     */
    @Transactional
    public void deleteRepositoryWithDependencies(Long repositoryId) {
        oraclePackageService.prEliminarRepositorioCascada(repositoryId);
    }

    /**
     * Delega el toggle de me gusta a PKG_REPOSITORIOS.pr_toggle_me_gusta_repo,
     * el cual se coordina con el trigger TRG_SYNC_ME_GUSTA_REPO sin duplicar el conteo.
     */
    @Transactional
    public Map<String, Object> toggleLike(Long id, User currentUser) {
        User user = AuthGuards.requireAuthenticated(currentUser, "Inicia sesión para dar me gusta.");
        StudyRepository repo = findRepoOrThrow(id);
        User author = repo.getAuthor();
        Long authorId = author != null ? author.getId() : null;
        String repoName = repo.getName();

        int[] out = oraclePackageService.prToggleMeGustaRepo(id, user.getId());
        boolean likedNow = out[0] == 1;
        int totalLikes = out[1];

        if (likedNow && authorId != null && !authorId.equals(user.getId())) {
            notificationService.create(
                    author,
                    NotificationType.LIKE,
                    "Nuevo me gusta en tu repositorio",
                    "@" + user.getUsername() + " le dio me gusta a \"" + repoName + "\".",
                    "/repositories/" + id
            );
        }

        return Map.of("liked", likedNow, "likes", totalLikes);
    }

    @Transactional
    public Map<String, Object> toggleFollow(Long id, User currentUser) {
        User user = AuthGuards.requireAuthenticated(currentUser, "Inicia sesión para seguir este repositorio.");
        findRepoOrThrow(id);

        long[] out = oraclePackageService.prToggleSeguirRepo(id, user.getId());
        boolean followedNow = out[0] == 1L;
        long followersCount = out[1];

        return Map.of("followed", followedNow, "followersCount", followersCount);
    }

    @Transactional(readOnly = true)
    public List<RepositoryResponseDto> getFollowed(User currentUser) {
        User user = AuthGuards.requireAuthenticated(currentUser, "Debes iniciar sesión para ver tus repositorios seguidos.");
        List<Long> ids = oraclePackageService.fnRepositoriosSeguidosIds(user.getId());
        List<StudyRepository> followed = oraclePackageService.orderByIds(
                ids,
                studyRepositoryRepository.findAllById(ids),
                StudyRepository::getId
        );
        return mapRepositories(followed, user);
    }

    @Transactional(readOnly = true)
    public List<RepositoryResponseDto> mapRepositories(List<StudyRepository> repositories, User viewer) {
        if (repositories.isEmpty()) {
            return List.of();
        }

        Long viewerId = viewer != null ? viewer.getId() : null;

        return repositories.stream()
                .map(repo -> {
                    Long repoId = repo.getId();
                    int docCount = resourceRepository.fnContarRecursosPublicados(repoId);
                    long followersCount = repositoryFollowRepository.fnContarSeguidoresRepo(repoId);
                    boolean liked = viewerId != null && repositoryLikeRepository.fnUsuarioDioLikeRepo(repoId, viewerId) == 1;
                    boolean followed = viewerId != null && repositoryFollowRepository.fnUsuarioSigueRepo(repoId, viewerId) == 1;

                    boolean isOwner = viewerId != null
                            && repo.getAuthor() != null
                            && repo.getAuthor().getId().equals(viewerId);

                    String rawCollabStatus = (!isOwner && viewerId != null)
                            ? repositoryCollaboratorRepository.fnEstadoColaboradorRepo(repoId, viewerId)
                            : null;
                    boolean isCollaborator = !isOwner && "ACEPTADO".equalsIgnoreCase(rawCollabStatus);
                    String collaboratorStatus = isOwner || rawCollabStatus == null
                            ? null
                            : (isCollaborator ? "aceptado" : "pendiente");
                    boolean canUpload = isOwner || isCollaborator;

                    return RepositoryResponseDto.fromEntity(
                            repo,
                            docCount,
                            liked,
                            followed,
                            followersCount,
                            canUpload,
                            isCollaborator,
                            collaboratorStatus
                    );
                })
                .toList();
    }

    private StudyRepository findRepoOrThrow(Long id) {
        return studyRepositoryRepository.findById(id)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.NOT_FOUND,
                        "REPOSITORY_NOT_FOUND",
                        "El repositorio no existe o fue eliminado."
                ));
    }

    private Subject resolveSubject(Long subjectId) {
        return catalogRepository.findById(subjectId)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.BAD_REQUEST,
                        "VALIDATION_ERROR",
                        "La materia seleccionada no existe.",
                        Map.of("subjectId", "Selecciona una materia válida.")
                ));
    }

    private void requireOwner(StudyRepository repo, User user, String message) {
        if (repo.getAuthor() == null || !repo.getAuthor().getId().equals(user.getId())) {
            throw new AuthException(HttpStatus.FORBIDDEN, "FORBIDDEN", message);
        }
    }

    private RepositoryResponseDto mapSingle(StudyRepository repo, User viewer) {
        return mapRepositories(List.of(repo), viewer).get(0);
    }
}
