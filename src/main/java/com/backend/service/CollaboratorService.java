package com.backend.service;

import com.backend.cross.CollaboratorStatus;
import com.backend.cross.NotificationType;
import com.backend.domain.identity.User;
import com.backend.domain.repos.RepositoryCollaborator;
import com.backend.domain.repos.StudyRepository;
import com.backend.dto.CollaborationsResponseDto;
import com.backend.dto.CollaboratorDto;
import com.backend.dto.RepositoryResponseDto;
import com.backend.exception.AuthException;
import com.backend.repository.RepositoryCollaboratorRepository;
import com.backend.repository.StudyRepositoryRepository;
import com.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Gestiona invitaciones, aceptación/rechazo y equipo de colaboradores de repositorios.
 */
@Service
public class CollaboratorService {

    private final RepositoryCollaboratorRepository collaboratorRepository;
    private final StudyRepositoryRepository studyRepositoryRepository;
    private final UserRepository userRepository;
    private final StudyRepositoryService studyRepositoryService;
    private final NotificationService notificationService;

    public CollaboratorService(
            RepositoryCollaboratorRepository collaboratorRepository,
            StudyRepositoryRepository studyRepositoryRepository,
            UserRepository userRepository,
            StudyRepositoryService studyRepositoryService,
            NotificationService notificationService
    ) {
        this.collaboratorRepository = collaboratorRepository;
        this.studyRepositoryRepository = studyRepositoryRepository;
        this.userRepository = userRepository;
        this.studyRepositoryService = studyRepositoryService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<CollaboratorDto> listByRepository(Long repositoryId, User viewer) {
        StudyRepository repo = findRepoOrThrow(repositoryId);
        boolean isOwner = viewer != null
                && repo.getAuthor() != null
                && repo.getAuthor().getId().equals(viewer.getId());

        return collaboratorRepository.findByRepositoryIdWithDetails(repositoryId).stream()
                .filter(collab -> collab.getStatus() == CollaboratorStatus.ACEPTADO
                        || isOwner
                        || (viewer != null && collab.getUser() != null && collab.getUser().getId().equals(viewer.getId())))
                .map(collab -> CollaboratorDto.fromEntity(collab, null))
                .toList();
    }

    @Transactional
    public CollaboratorDto invite(Long repositoryId, String rawUsername, User currentUser) {
        User owner = requireAuthenticated(currentUser, "Inicia sesión para invitar colaboradores.");
        StudyRepository repo = findRepoOrThrow(repositoryId);
        if (repo.getAuthor() == null || !repo.getAuthor().getId().equals(owner.getId())) {
            throw new AuthException(
                    HttpStatus.FORBIDDEN,
                    "FORBIDDEN",
                    "Solo el dueño del repositorio puede invitar colaboradores."
            );
        }

        String cleanUsername = rawUsername == null
                ? ""
                : rawUsername.trim().replaceFirst("^@", "").toLowerCase(Locale.ROOT);
        if (cleanUsername.isEmpty()) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Ingresa o selecciona el usuario que deseas invitar."
            );
        }

        User target = userRepository.findByUsernameIgnoreCase(cleanUsername)
                .filter(User::isVerified)
                .filter(candidate -> candidate.getRole() == null
                        || candidate.getRole().getName() == null
                        || !candidate.getRole().getName().toLowerCase(Locale.ROOT).contains("admin"))
                .orElseThrow(() -> new AuthException(
                        HttpStatus.NOT_FOUND,
                        "USER_NOT_FOUND",
                        "No existe un estudiante registrado con @" + cleanUsername + "."
                ));

        if (target.getId().equals(owner.getId())) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Ya eres el dueño de este repositorio."
            );
        }

        collaboratorRepository.findByStudyRepositoryIdAndUserId(repositoryId, target.getId())
                .ifPresent(existing -> {
                    String msg = existing.getStatus() == CollaboratorStatus.ACEPTADO
                            ? "@" + target.getUsername() + " ya es colaborador de este repositorio."
                            : "@" + target.getUsername() + " ya tiene una invitación pendiente.";
                    throw new AuthException(HttpStatus.CONFLICT, "COLLABORATOR_EXISTS", msg);
                });

        RepositoryCollaborator created = collaboratorRepository.save(
                new RepositoryCollaborator(repo, target, owner)
        );

        notificationService.create(
                target,
                NotificationType.COLLAB_INVITE,
                "Invitación a colaborar",
                "@" + owner.getUsername() + " te invitó a colaborar en \"" + repo.getName() + "\".",
                "/repositories/" + repo.getId()
        );

        return CollaboratorDto.fromEntity(created, null);
    }

    @Transactional
    public Map<String, String> respond(Long repositoryId, boolean accept, User currentUser) {
        User user = requireAuthenticated(currentUser, "Inicia sesión para responder la invitación.");
        StudyRepository repo = findRepoOrThrow(repositoryId);

        RepositoryCollaborator invite = collaboratorRepository.findByStudyRepositoryIdAndUserId(repositoryId, user.getId())
                .filter(c -> c.getStatus() == CollaboratorStatus.PENDIENTE)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.NOT_FOUND,
                        "INVITATION_NOT_FOUND",
                        "No tienes una invitación pendiente en este repositorio."
                ));

        if (accept) {
            invite.accept();
            collaboratorRepository.save(invite);
            notificationService.create(
                    repo.getAuthor(),
                    NotificationType.COLLAB_INVITE,
                    "Invitación aceptada",
                    "@" + user.getUsername() + " aceptó colaborar en \"" + repo.getName() + "\".",
                    "/repositories/" + repo.getId()
            );
            return Map.of("status", "aceptado");
        }

        collaboratorRepository.delete(invite);
        notificationService.create(
                repo.getAuthor(),
                NotificationType.COLLAB_INVITE,
                "Invitación rechazada",
                "@" + user.getUsername() + " rechazó la invitación a colaborar en \"" + repo.getName() + "\".",
                "/repositories/" + repo.getId()
        );
        return Map.of("status", "rechazado");
    }

    @Transactional
    public void remove(Long repositoryId, String usernameToRemove, User currentUser) {
        User user = requireAuthenticated(currentUser, "Inicia sesión para gestionar colaboradores.");
        StudyRepository repo = findRepoOrThrow(repositoryId);

        String cleanTarget = usernameToRemove == null
                ? ""
                : usernameToRemove.trim().replaceFirst("^@", "").toLowerCase(Locale.ROOT);

        boolean isOwner = repo.getAuthor() != null && repo.getAuthor().getId().equals(user.getId());
        boolean isSelfLeave = user.getUsername().equalsIgnoreCase(cleanTarget);
        if (!isOwner && !isSelfLeave) {
            throw new AuthException(
                    HttpStatus.FORBIDDEN,
                    "FORBIDDEN",
                    "Solo el dueño o el propio colaborador pueden realizar esta acción."
            );
        }

        collaboratorRepository.findByStudyRepositoryIdAndUserUsernameIgnoreCase(repositoryId, cleanTarget)
                .ifPresent(collaboratorRepository::delete);
    }

    @Transactional(readOnly = true)
    public CollaborationsResponseDto getMyCollaborations(User currentUser) {
        User user = requireAuthenticated(currentUser, "Inicia sesión para ver tus colaboraciones.");
        List<RepositoryCollaborator> records = collaboratorRepository.findByUserIdWithDetails(user.getId());
        if (records.isEmpty()) {
            return new CollaborationsResponseDto(List.of(), List.of());
        }

        List<StudyRepository> repos = records.stream()
                .map(RepositoryCollaborator::getStudyRepository)
                .distinct()
                .toList();
        List<RepositoryResponseDto> mappedRepos = studyRepositoryService.mapRepositories(repos, user);
        Map<String, RepositoryResponseDto> repoMap = new LinkedHashMap<>();
        for (RepositoryResponseDto dto : mappedRepos) {
            repoMap.put(dto.getId(), dto);
        }

        List<CollaboratorDto> invitations = new ArrayList<>();
        List<RepositoryResponseDto> collaboratedRepositories = new ArrayList<>();

        for (RepositoryCollaborator record : records) {
            String repoIdStr = String.valueOf(record.getStudyRepository().getId());
            RepositoryResponseDto repoDto = repoMap.get(repoIdStr);
            if (record.getStatus() == CollaboratorStatus.PENDIENTE) {
                invitations.add(CollaboratorDto.fromEntity(record, repoDto));
            } else if (record.getStatus() == CollaboratorStatus.ACEPTADO && repoDto != null) {
                collaboratedRepositories.add(repoDto);
            }
        }

        return new CollaborationsResponseDto(invitations, collaboratedRepositories);
    }

    private StudyRepository findRepoOrThrow(Long repositoryId) {
        return studyRepositoryRepository.findByIdWithDetails(repositoryId)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.NOT_FOUND,
                        "REPOSITORY_NOT_FOUND",
                        "No encontramos ese repositorio."
                ));
    }

    private User requireAuthenticated(User user, String message) {
        if (user == null) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", message);
        }
        return user;
    }
}
