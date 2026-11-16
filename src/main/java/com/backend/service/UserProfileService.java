package com.backend.service;

import com.backend.domain.academy.Subject;
import com.backend.domain.identity.User;
import com.backend.domain.identity.UserFollow;
import com.backend.domain.identity.UserFollowId;
import com.backend.domain.identity.UserSubjectInterest;
import com.backend.dto.ChangePasswordRequest;
import com.backend.dto.PublicUserProfileDto;
import com.backend.dto.SubjectDto;
import com.backend.dto.UpdateProfileRequest;
import com.backend.dto.UserDto;
import com.backend.exception.AuthException;
import com.backend.repository.CatalogRepository;
import com.backend.repository.UserFollowRepository;
import com.backend.repository.UserRepository;
import com.backend.repository.UserSubjectInterestRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Gestiona el perfil privado y público del usuario, seguimiento mutuo y materias de interés.
 */
@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final UserFollowRepository userFollowRepository;
    private final UserSubjectInterestRepository userSubjectInterestRepository;
    private final CatalogRepository catalogRepository;
    private final PasswordEncoder passwordEncoder;

    public UserProfileService(
            UserRepository userRepository,
            UserFollowRepository userFollowRepository,
            UserSubjectInterestRepository userSubjectInterestRepository,
            CatalogRepository catalogRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.userFollowRepository = userFollowRepository;
        this.userSubjectInterestRepository = userSubjectInterestRepository;
        this.catalogRepository = catalogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserDto updateProfile(UpdateProfileRequest request, User currentUser) {
        User user = requireAuthenticated(currentUser, "Debes iniciar sesión para editar tu perfil.");

        String cleanName = request.getName() == null ? "" : request.getName().trim().replaceAll("\\s+", " ");
        String cleanUsername = request.getUsername() == null ? "" : request.getUsername().trim().toLowerCase(Locale.ROOT);
        Integer semester = request.getSemester();

        Map<String, String> fields = new LinkedHashMap<>();
        if (cleanName.length() < 3 || cleanName.length() > 80) {
            fields.put("name", "Escribe tu nombre completo (entre 3 y 80 caracteres).");
        }
        if (!AuthService.isValidUsername(cleanUsername)) {
            fields.put("username", "Entre 3 y 20 caracteres: letras, números, punto o guion bajo.");
        } else if (userRepository.existsByUsernameIgnoreCaseAndIdNot(cleanUsername, user.getId())) {
            fields.put("username", "Ese nombre de usuario ya está en uso.");
        }

        boolean isAdmin = isAdminRole(user);

        if (!isAdmin) {
            if (semester == null) {
                fields.put("semester", "Selecciona tu semestre.");
            } else if (semester < 1 || semester > 9) {
                fields.put("semester", "Selecciona un semestre entre 1 y 9.");
            }
        }

        if (!fields.isEmpty()) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Revisa los datos del formulario.",
                    fields
            );
        }

        applyFullName(user, cleanName);
        user.setUsername(cleanUsername);
        if (!isAdmin) {
            user.setSemester(semester);
        }

        User saved = userRepository.save(user);
        return UserDto.fromEntity(saved);
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request, User currentUser) {
        User user = requireAuthenticated(currentUser, "Debes iniciar sesión para cambiar tu contraseña.");

        String currentPassword = request.getCurrentPassword() == null ? "" : request.getCurrentPassword();
        String newPassword = request.getNewPassword() == null ? "" : request.getNewPassword();

        Map<String, String> fields = new LinkedHashMap<>();
        if (currentPassword.isEmpty()) {
            fields.put("currentPassword", "Escribe tu contraseña actual.");
        } else if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            fields.put("currentPassword", "La contraseña actual no es correcta.");
        }

        if (!AuthService.isValidPassword(newPassword)) {
            fields.put(
                    "newPassword",
                    "Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número."
            );
        } else if (newPassword.equals(currentPassword)) {
            fields.put("newPassword", "La nueva contraseña debe ser diferente a la actual.");
        }

        if (!fields.isEmpty()) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Revisa los datos del formulario.",
                    fields
            );
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public PublicUserProfileDto getPublicProfile(String username, User viewer) {
        User target = findActiveUserByUsername(username);
        return mapList(List.of(target), viewer).get(0);
    }

    @Transactional
    public PublicUserProfileDto toggleFollow(String username, User currentUser) {
        User viewer = requireAuthenticated(currentUser, "Debes iniciar sesión para seguir a otros usuarios.");
        User target = findActiveUserByUsername(username);

        if (target.getId().equals(viewer.getId())) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "No puedes seguirte a ti mismo.");
        }

        UserFollowId followId = new UserFollowId(viewer.getId(), target.getId());
        if (userFollowRepository.existsById(followId)) {
            userFollowRepository.deleteById(followId);
        } else {
            userFollowRepository.save(new UserFollow(viewer.getId(), target.getId()));
        }

        return mapList(List.of(target), viewer).get(0);
    }

    @Transactional(readOnly = true)
    public List<PublicUserProfileDto> getFriends(User currentUser) {
        User viewer = requireAuthenticated(currentUser, "Debes iniciar sesión para consultar tu red de amigos.");
        return mapList(userFollowRepository.findMutualFriends(viewer.getId()), viewer);
    }

    @Transactional(readOnly = true)
    public List<PublicUserProfileDto> getFollowing(User currentUser) {
        User viewer = requireAuthenticated(currentUser, "Debes iniciar sesión para consultar tu red de amigos.");
        return mapList(userFollowRepository.findFollowingUsers(viewer.getId()), viewer);
    }

    @Transactional(readOnly = true)
    public List<PublicUserProfileDto> getFollowers(User currentUser) {
        User viewer = requireAuthenticated(currentUser, "Debes iniciar sesión para consultar tu red de amigos.");
        return mapList(userFollowRepository.findFollowerUsers(viewer.getId()), viewer);
    }

    @Transactional(readOnly = true)
    public List<PublicUserProfileDto> searchUsers(String query, User viewer) {
        String cleanQuery = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        List<User> candidates = userRepository.findVerifiedUsers().stream()
                .filter(candidate -> !isAdminRole(candidate))
                .filter(candidate -> {
                    if (cleanQuery.isEmpty()) {
                        return true;
                    }
                    String username = candidate.getUsername() == null ? "" : candidate.getUsername().toLowerCase(Locale.ROOT);
                    String semesterText = candidate.getSemester() != null ? "semestre " + candidate.getSemester() : "";
                    return username.contains(cleanQuery) || semesterText.contains(cleanQuery);
                })
                .toList();
        return mapList(candidates, viewer);
    }

    @Transactional(readOnly = true)
    public List<SubjectDto> getSubjectsOfInterest(User currentUser) {
        User user = requireAuthenticated(currentUser, "Debes iniciar sesión para consultar tus materias.");
        return userSubjectInterestRepository.findSubjectsByUserId(user.getId()).stream()
                .map(SubjectDto::fromEntity)
                .toList();
    }

    @Transactional
    public List<SubjectDto> updateSubjectsOfInterest(List<Long> rawSubjectIds, User currentUser) {
        User user = requireAuthenticated(currentUser, "Debes iniciar sesión para guardar tus materias.");

        Set<Long> uniqueIds = rawSubjectIds == null
                ? Collections.emptySet()
                : rawSubjectIds.stream()
                        .filter(id -> id != null && id > 0)
                        .collect(Collectors.toCollection(LinkedHashSet::new));

        List<Subject> validSubjects = uniqueIds.isEmpty()
                ? Collections.emptyList()
                : catalogRepository.findAllById(uniqueIds);

        if (validSubjects.size() != uniqueIds.size()) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Una o más materias seleccionadas no existen."
            );
        }

        userSubjectInterestRepository.deleteByIdUserId(user.getId());
        userSubjectInterestRepository.flush();

        if (!validSubjects.isEmpty()) {
            List<UserSubjectInterest> entries = validSubjects.stream()
                    .map(subject -> new UserSubjectInterest(user.getId(), subject.getId()))
                    .toList();
            userSubjectInterestRepository.saveAll(entries);
        }

        return userSubjectInterestRepository.findSubjectsByUserId(user.getId()).stream()
                .map(SubjectDto::fromEntity)
                .toList();
    }

    private User findActiveUserByUsername(String rawUsername) {
        String cleanUsername = rawUsername == null ? "" : rawUsername.trim().toLowerCase(Locale.ROOT);
        if (cleanUsername.isEmpty()) {
            throw new AuthException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "El usuario no existe.");
        }
        return userRepository.findByUsernameIgnoreCase(cleanUsername)
                .filter(User::isVerified)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.NOT_FOUND,
                        "USER_NOT_FOUND",
                        "El usuario no existe."
                ));
    }

    private boolean isAdminRole(User user) {
        return user.getRole() != null
                && user.getRole().getName() != null
                && user.getRole().getName().toLowerCase(Locale.ROOT).contains("admin");
    }

    private User requireAuthenticated(User user, String message) {
        if (user == null) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", message);
        }
        return user;
    }

    private void applyFullName(User user, String fullName) {
        String[] parts = fullName.split("\\s+");
        if (parts.length == 1) {
            user.setFirst_name(parts[0]);
            user.setSecond_name(null);
            user.setFirst_lastname(" ");
            user.setSecond_lastname(" ");
        } else if (parts.length == 2) {
            user.setFirst_name(parts[0]);
            user.setSecond_name(null);
            user.setFirst_lastname(parts[1]);
            user.setSecond_lastname(" ");
        } else if (parts.length == 3) {
            user.setFirst_name(parts[0]);
            user.setSecond_name(null);
            user.setFirst_lastname(parts[1]);
            user.setSecond_lastname(parts[2]);
        } else {
            user.setFirst_name(parts[0]);
            user.setSecond_name(parts[1]);
            user.setFirst_lastname(parts[2]);
            user.setSecond_lastname(String.join(" ", Arrays.copyOfRange(parts, 3, parts.length)));
        }
    }

    private List<PublicUserProfileDto> mapList(List<User> users, User viewer) {
        if (users.isEmpty()) {
            return List.of();
        }

        List<Long> ids = users.stream().map(User::getId).toList();

        Map<Long, Long> followersCounts = new HashMap<>();
        for (Object[] row : userFollowRepository.countFollowersByUserIds(ids)) {
            followersCounts.put((Long) row[0], (Long) row[1]);
        }

        Map<Long, Long> followingCounts = new HashMap<>();
        for (Object[] row : userFollowRepository.countFollowingByUserIds(ids)) {
            followingCounts.put((Long) row[0], (Long) row[1]);
        }

        Set<Long> followingIds = viewer != null
                ? new HashSet<>(userFollowRepository.findFollowedUserIds(viewer.getId(), ids))
                : Collections.emptySet();

        Set<Long> followerIds = viewer != null
                ? new HashSet<>(userFollowRepository.findFollowerUserIds(viewer.getId(), ids))
                : Collections.emptySet();

        return users.stream()
                .map(target -> {
                    boolean isSelf = viewer != null && viewer.getId().equals(target.getId());
                    boolean isFollowing = !isSelf && followingIds.contains(target.getId());
                    boolean followsMe = !isSelf && followerIds.contains(target.getId());
                    return PublicUserProfileDto.fromEntity(
                            target,
                            isSelf,
                            followersCounts.getOrDefault(target.getId(), 0L),
                            followingCounts.getOrDefault(target.getId(), 0L),
                            isFollowing,
                            followsMe
                    );
                })
                .toList();
    }
}
