package com.backend.service;

import com.backend.cross.ContactMethodType;
import com.backend.cross.NotificationType;
import com.backend.domain.academy.Subject;
import com.backend.domain.identity.User;
import com.backend.domain.identity.UserContact;
import com.backend.domain.identity.UserSubjectInterest;
import com.backend.dto.ChangePasswordRequest;
import com.backend.dto.ContactItemRequest;
import com.backend.dto.PublicUserProfileDto;
import com.backend.dto.SubjectDto;
import com.backend.dto.UpdateProfileRequest;
import com.backend.dto.UserDto;
import com.backend.exception.AuthException;
import com.backend.repository.CatalogRepository;
import com.backend.repository.UserContactRepository;
import com.backend.repository.UserFollowRepository;
import com.backend.repository.UserRepository;
import com.backend.repository.UserSubjectInterestRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Gestiona el perfil privado y público del usuario, seguimiento mutuo y materias de interés
 * invocando funciones y procedimientos de PKG_AUTH_USUARIOS.
 */
@Service
public class UserProfileService {

    public static final int MAX_BIO_LENGTH = 500;
    public static final int MAX_CONTACTS = 8;
    public static final int MAX_CONTACT_VALUE_LENGTH = 255;
    public static final int MAX_CONTACT_LABEL_LENGTH = 60;

    private static final Pattern CONTACT_EMAIL_PATTERN =
            Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$");
    private static final Pattern WHATSAPP_PATTERN =
            Pattern.compile("^\\+?[0-9\\s\\-()]{7,20}$");

    private final UserRepository userRepository;
    private final UserContactRepository userContactRepository;
    private final UserSubjectInterestRepository userSubjectInterestRepository;
    private final CatalogRepository catalogRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;
    private final OraclePackageService oraclePackageService;
    private final com.backend.repository.AuthUsuariosRepository authUsuariosRepository;
    private final JwtTokenService jwtTokenService;

    public UserProfileService(
            UserRepository userRepository,
            UserContactRepository userContactRepository,
            UserSubjectInterestRepository userSubjectInterestRepository,
            CatalogRepository catalogRepository,
            PasswordEncoder passwordEncoder,
            NotificationService notificationService,
            OraclePackageService oraclePackageService,
            com.backend.repository.AuthUsuariosRepository authUsuariosRepository,
            JwtTokenService jwtTokenService
    ) {
        this.userRepository = userRepository;
        this.userContactRepository = userContactRepository;
        this.userSubjectInterestRepository = userSubjectInterestRepository;
        this.catalogRepository = catalogRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
        this.oraclePackageService = oraclePackageService;
        this.authUsuariosRepository = authUsuariosRepository;
        this.jwtTokenService = jwtTokenService;
    }

    @Transactional(readOnly = true)
    public UserDto getMyProfile(User currentUser) {
        User user = AuthGuards.requireAuthenticated(currentUser, "Debes iniciar sesión para consultar tu perfil.");
        List<UserContact> contacts = loadUserContacts(user.getId());
        UserDto dto = UserDto.fromEntity(user, contacts);
        long[] counts = loadFollowCounts(user.getId());
        dto.setFollowersCount(counts[0]);
        dto.setFollowingCount(counts[1]);
        return dto;
    }

    private long[] loadFollowCounts(Long userId) {
        List<Object[]> rows = userRepository.findFollowCountsByUserId(userId);
        if (!rows.isEmpty() && rows.get(0) != null && rows.get(0).length >= 2) {
            Object[] row = rows.get(0);
            long followers = row[0] instanceof Number n0 ? n0.longValue() : 0L;
            long following = row[1] instanceof Number n1 ? n1.longValue() : 0L;
            return new long[]{followers, following};
        }
        return new long[]{0L, 0L};
    }

    @Transactional
    public UserDto updateProfile(UpdateProfileRequest request, User currentUser) {
        User user = AuthGuards.requireAuthenticated(currentUser, "Debes iniciar sesión para editar tu perfil.");

        String cleanName = request.getName() == null ? "" : request.getName().trim().replaceAll("\\s+", " ");
        String cleanUsername = request.getUsername() == null ? "" : request.getUsername().trim().toLowerCase(Locale.ROOT);
        Integer semester = request.getSemester();
        String rawBio = request.getBio();
        String cleanBio = rawBio == null ? null : rawBio.replace("\r\n", "\n").trim();

        Map<String, String> fields = new LinkedHashMap<>();
        if (cleanName.length() < 3 || cleanName.length() > 80) {
            fields.put("name", "Escribe tu nombre completo (entre 3 y 80 caracteres).");
        }
        if (!AuthService.isValidUsername(cleanUsername)) {
            fields.put("username", "Entre 3 y 20 caracteres: letras, números, punto o guion bajo.");
        } else if (authUsuariosRepository.existeUsernameOtro(cleanUsername, user.getId()) == 1) {
            fields.put("username", "Ese nombre de usuario ya está en uso.");
        }

        boolean isAdmin = AuthGuards.isAdmin(user);

        if (!isAdmin) {
            if (semester == null) {
                fields.put("semester", "Selecciona tu semestre.");
            } else if (semester < 1 || semester > 9) {
                fields.put("semester", "Selecciona un semestre entre 1 y 9.");
            }
        }

        if (cleanBio != null && cleanBio.length() > MAX_BIO_LENGTH) {
            fields.put("bio", "La descripción no puede superar los " + MAX_BIO_LENGTH + " caracteres.");
        }

        List<UserContact> validatedContacts = null;
        if (request.getContacts() != null) {
            validatedContacts = validateAndBuildContacts(user, request.getContacts(), fields);
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
        if (cleanBio != null) {
            user.setBio(cleanBio.isEmpty() ? null : cleanBio);
        }

        User saved = userRepository.save(user);
        jwtTokenService.evictUser(saved.getId());

        List<UserContact> savedContacts;
        if (validatedContacts != null) {
            oraclePackageService.prEliminarContactosUsuario(saved.getId());
            savedContacts = validatedContacts.isEmpty()
                    ? Collections.emptyList()
                    : userContactRepository.saveAll(validatedContacts);
        } else {
            savedContacts = loadUserContacts(saved.getId());
        }

        return UserDto.fromEntity(saved, savedContacts);
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request, User currentUser) {
        User user = AuthGuards.requireAuthenticated(currentUser, "Debes iniciar sesión para cambiar tu contraseña.");

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
        jwtTokenService.evictUser(user.getId());
    }

    @Transactional(readOnly = true)
    public PublicUserProfileDto getPublicProfile(String username, User viewer) {
        User target = findActiveUserByUsername(username);
        return mapList(List.of(target), viewer).get(0);
    }

    @Transactional
    public PublicUserProfileDto toggleFollow(String username, User currentUser) {
        User viewer = AuthGuards.requireAuthenticated(currentUser, "Debes iniciar sesión para seguir a otros usuarios.");
        User target = findActiveUserByUsername(username);

        if (target.getId().equals(viewer.getId())) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "No puedes seguirte a ti mismo.");
        }

        int[] out = oraclePackageService.prToggleSeguirUsuario(viewer.getId(), target.getId());
        boolean nowFollowing = out[0] == 1;
        boolean mutual = out[1] == 1;

        if (nowFollowing) {
            notificationService.create(
                    target,
                    mutual ? NotificationType.FRIEND_MATCH : NotificationType.NEW_FOLLOWER,
                    mutual ? "¡Nuevo amigo en Alejandría!" : "Nuevo seguidor",
                    mutual
                            ? "@" + viewer.getUsername() + " también comenzó a seguirte. Ahora tienen seguimiento mutuo."
                            : "@" + viewer.getUsername() + " comenzó a seguirte.",
                    "/users/" + viewer.getUsername()
            );
        }

        return mapList(List.of(target), viewer).get(0);
    }

    @Transactional(readOnly = true)
    public List<PublicUserProfileDto> getFriends(User currentUser) {
        User viewer = AuthGuards.requireAuthenticated(currentUser, "Debes iniciar sesión para consultar tu red de amigos.");
        List<Long> ids = oraclePackageService.fnObtenerAmigosMutuosIds(viewer.getId());
        return mapList(loadUsersInOrder(ids), viewer);
    }

    @Transactional(readOnly = true)
    public List<PublicUserProfileDto> getFollowing(User currentUser) {
        User viewer = AuthGuards.requireAuthenticated(currentUser, "Debes iniciar sesión para consultar tu red de amigos.");
        List<Long> ids = oraclePackageService.fnObtenerSeguidosUsuarioIds(viewer.getId());
        return mapList(loadUsersInOrder(ids), viewer);
    }

    @Transactional(readOnly = true)
    public List<PublicUserProfileDto> getFollowers(User currentUser) {
        User viewer = AuthGuards.requireAuthenticated(currentUser, "Debes iniciar sesión para consultar tu red de amigos.");
        List<Long> ids = oraclePackageService.fnObtenerSeguidoresUsuarioIds(viewer.getId());
        return mapList(loadUsersInOrder(ids), viewer);
    }

    @Transactional(readOnly = true)
    public List<PublicUserProfileDto> searchUsers(String query, User viewer) {
        String cleanQuery = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        String queryPattern = cleanQuery.isEmpty()
                ? null
                : "%" + cleanQuery.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
        Integer parsedSemester = parseSemesterFromQuery(cleanQuery);
        List<Long> ids = oraclePackageService.fnBuscarEstudiantesActivosIds(queryPattern, parsedSemester, 50);
        return mapList(loadUsersInOrder(ids), viewer);
    }

    @Transactional(readOnly = true)
    public List<SubjectDto> getSubjectsOfInterest(User currentUser) {
        User user = AuthGuards.requireAuthenticated(currentUser, "Debes iniciar sesión para consultar tus materias.");
        List<Long> subjectIds = oraclePackageService.fnMateriasInteresUsuarioIds(user.getId());
        if (subjectIds.isEmpty()) {
            return List.of();
        }
        return oraclePackageService.orderByIds(subjectIds, catalogRepository.findAllWithSemesterByIdIn(subjectIds), Subject::getId)
                .stream()
                .map(SubjectDto::fromEntity)
                .toList();
    }

    @Transactional
    public List<SubjectDto> updateSubjectsOfInterest(List<Long> rawSubjectIds, User currentUser) {
        User user = AuthGuards.requireAuthenticated(currentUser, "Debes iniciar sesión para guardar tus materias.");

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

        oraclePackageService.prEliminarMateriasInteres(user.getId());

        if (!validSubjects.isEmpty()) {
            List<UserSubjectInterest> entries = validSubjects.stream()
                    .map(subject -> new UserSubjectInterest(user.getId(), subject.getId()))
                    .toList();
            userSubjectInterestRepository.saveAll(entries);
        }

        List<Long> subjectIds = oraclePackageService.fnMateriasInteresUsuarioIds(user.getId());
        if (subjectIds.isEmpty()) {
            return List.of();
        }
        return oraclePackageService.orderByIds(subjectIds, catalogRepository.findAllWithSemesterByIdIn(subjectIds), Subject::getId)
                .stream()
                .map(SubjectDto::fromEntity)
                .toList();
    }

    private List<User> loadUsersInOrder(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return oraclePackageService.orderByIds(ids, userRepository.findAllWithRoleByIdIn(ids), User::getId);
    }

    private List<UserContact> loadUserContacts(Long userId) {
        List<Long> ids = oraclePackageService.fnContactosUsuarioIds(userId);
        return oraclePackageService.orderByIds(ids, userContactRepository.findAllById(ids), UserContact::getId);
    }

    private User findActiveUserByUsername(String rawUsername) {
        String cleanUsername = rawUsername == null ? "" : rawUsername.trim().toLowerCase(Locale.ROOT);
        if (cleanUsername.isEmpty()) {
            throw new AuthException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "El usuario no existe.");
        }
        Long id = authUsuariosRepository.buscarUsuarioPorUsername(cleanUsername);
        return (id == null ? Optional.<User>empty() : userRepository.findById(id))
                .filter(User::isVerified)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.NOT_FOUND,
                        "USER_NOT_FOUND",
                        "El usuario no existe."
                ));
    }

    private Integer parseSemesterFromQuery(String cleanQuery) {
        if (cleanQuery == null || cleanQuery.isEmpty()) {
            return null;
        }
        String candidate = cleanQuery;
        if (candidate.startsWith("semestre")) {
            candidate = candidate.substring("semestre".length()).trim();
        }
        if (candidate.matches("^\\d{1,2}$")) {
            int semester = Integer.parseInt(candidate);
            if (semester >= 1 && semester <= 12) {
                return semester;
            }
        }
        return null;
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

        Long viewerId = viewer != null ? viewer.getId() : null;
        List<Long> userIds = users.stream().map(User::getId).toList();

        Map<Long, Object[]> metricsByUserId = new LinkedHashMap<>(userIds.size());
        List<Object[]> rawMetrics = (viewerId != null)
                ? userRepository.findViewerFollowMetricsByIdIn(userIds, viewerId)
                : userRepository.findPublicFollowMetricsByIdIn(userIds);
        for (Object[] row : rawMetrics) {
            if (row != null && row.length >= 3 && row[0] instanceof Number idNum) {
                metricsByUserId.put(idNum.longValue(), row);
            }
        }

        Map<Long, List<UserContact>> contactsByUserId = new LinkedHashMap<>();
        for (UserContact contact : userContactRepository.findAllByUserIdsOrdered(userIds)) {
            if (contact.getUser() != null && contact.getUser().getId() != null) {
                contactsByUserId.computeIfAbsent(contact.getUser().getId(), k -> new ArrayList<>()).add(contact);
            }
        }

        return users.stream()
                .map(target -> {
                    Long targetId = target.getId();
                    boolean isSelf = viewerId != null && viewerId.equals(targetId);
                    Object[] row = metricsByUserId.get(targetId);

                    long followersCount = (row != null && row[1] instanceof Number n1)
                            ? n1.longValue()
                            : authUsuariosRepository.contarSeguidoresUsuario(targetId);
                    long followingCount = (row != null && row[2] instanceof Number n2)
                            ? n2.longValue()
                            : authUsuariosRepository.contarSeguidosUsuario(targetId);
                    boolean isFollowing = !isSelf && viewerId != null && (
                            (row != null && row.length > 3 && row[3] instanceof Number n3)
                                    ? n3.intValue() == 1
                                    : authUsuariosRepository.esSeguidorUsuario(viewerId, targetId) == 1
                    );
                    boolean followsMe = !isSelf && viewerId != null && (
                            (row != null && row.length > 4 && row[4] instanceof Number n4)
                                    ? n4.intValue() == 1
                                    : authUsuariosRepository.esSeguidorUsuario(targetId, viewerId) == 1
                    );
                    List<UserContact> contacts = contactsByUserId.getOrDefault(targetId, List.of());

                    return PublicUserProfileDto.fromEntity(
                            target,
                            isSelf,
                            followersCount,
                            followingCount,
                            isFollowing,
                            followsMe,
                            contacts
                    );
                })
                .toList();
    }

    private List<UserContact> validateAndBuildContacts(
            User user,
            List<ContactItemRequest> rawContacts,
            Map<String, String> fields
    ) {
        if (rawContacts.size() > MAX_CONTACTS) {
            fields.put("contacts", "Puedes registrar como máximo " + MAX_CONTACTS + " medios de contacto.");
            return Collections.emptyList();
        }

        List<UserContact> built = new ArrayList<>();
        for (int i = 0; i < rawContacts.size(); i++) {
            ContactItemRequest item = rawContacts.get(i);
            if (item == null) {
                fields.put("contacts." + i + ".value", "Completa o elimina este medio de contacto.");
                continue;
            }

            ContactMethodType type = ContactMethodType.fromValue(item.getType()).orElse(null);
            if (type == null) {
                fields.put("contacts." + i + ".type", "Selecciona un tipo de contacto válido.");
            }

            String cleanValue = item.getValue() == null ? "" : item.getValue().trim();
            String cleanLabel = item.getLabel() == null ? "" : item.getLabel().trim();

            if (cleanLabel.length() > MAX_CONTACT_LABEL_LENGTH) {
                fields.put(
                        "contacts." + i + ".label",
                        "La etiqueta no puede superar " + MAX_CONTACT_LABEL_LENGTH + " caracteres."
                );
            }

            String valueError = validateContactValue(type, cleanValue);
            if (valueError != null) {
                fields.put("contacts." + i + ".value", valueError);
            }

            if (type != null && valueError == null && cleanLabel.length() <= MAX_CONTACT_LABEL_LENGTH) {
                built.add(new UserContact(
                        user,
                        type,
                        cleanValue,
                        cleanLabel.isEmpty() ? null : cleanLabel,
                        i
                ));
            }
        }
        return built;
    }

    private String validateContactValue(ContactMethodType type, String value) {
        if (value.isEmpty()) {
            return "Escribe el dato o enlace de contacto.";
        }
        if (value.length() > MAX_CONTACT_VALUE_LENGTH) {
            return "No puede superar " + MAX_CONTACT_VALUE_LENGTH + " caracteres.";
        }
        String lower = value.toLowerCase(Locale.ROOT);
        if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
            return "Ese formato de enlace no está permitido.";
        }
        if (type == null) {
            return null;
        }
        return switch (type) {
            case EMAIL -> CONTACT_EMAIL_PATTERN.matcher(value).matches()
                    ? null
                    : "Escribe un correo electrónico válido.";
            case WHATSAPP -> {
                long digits = value.chars().filter(Character::isDigit).count();
                yield WHATSAPP_PATTERN.matcher(value).matches() && digits >= 7 && digits <= 15
                        ? null
                        : "Escribe un número de WhatsApp válido (ej. +57 300 123 4567).";
            }
            case WEBSITE -> isSafeHttpUrl(value)
                    ? null
                    : "Ingresa una URL válida que comience con https:// o http://.";
            case INSTAGRAM, GITHUB, TELEGRAM, LINKEDIN -> validateSocialHandleOrUrl(value);
            case DISCORD -> value.length() >= 2 && value.length() <= 60
                    ? null
                    : "Escribe tu usuario de Discord (entre 2 y 60 caracteres).";
            case OTHER -> value.length() >= 2
                    ? null
                    : "Escribe al menos 2 caracteres.";
        };
    }

    private String validateSocialHandleOrUrl(String value) {
        String lower = value.toLowerCase(Locale.ROOT);
        if (lower.startsWith("http://") || lower.startsWith("https://")) {
            return isSafeHttpUrl(value) ? null : "Ingresa una URL válida.";
        }
        if (value.contains(" ") || value.length() < 2) {
            return "Escribe un usuario válido (sin espacios) o una URL completa.";
        }
        return null;
    }

    private boolean isSafeHttpUrl(String value) {
        try {
            URI uri = URI.create(value);
            String scheme = uri.getScheme();
            String host = uri.getHost();
            return scheme != null
                    && (scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))
                    && host != null
                    && host.contains(".");
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }
}
