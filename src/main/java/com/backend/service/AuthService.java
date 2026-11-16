package com.backend.service;

import com.backend.domain.identity.Role;
import com.backend.domain.identity.User;
import com.backend.dto.ApiMessageResponse;
import com.backend.dto.AuthResponse;
import com.backend.dto.LoginRequest;
import com.backend.dto.RegisterRequest;
import com.backend.dto.ResendVerificationRequest;
import com.backend.dto.UserDto;
import com.backend.dto.VerifyEmailRequest;
import com.backend.exception.AuthException;
import com.backend.repository.RoleRepository;
import com.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final String INSTITUTIONAL_DOMAIN = "@unicesar.edu.co";
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9._]{3,20}$");
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("\\d");

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationService emailVerificationService;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            EmailVerificationService emailVerificationService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailVerificationService = emailVerificationService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalize(request.getEmail());
        String username = normalize(request.getUsername());
        String firstName = trim(request.getFirst_name());
        String secondName = trim(request.getSecond_name());
        String firstLastname = trim(request.getFirst_lastname());
        String secondLastname = trim(request.getSecond_lastname());
        String plainPassword = request.getPassword() == null ? "" : request.getPassword();

        Map<String, String> fields = validateRegistrationFields(
                firstName, firstLastname, secondLastname, username, email, plainPassword
        );
        if (!fields.isEmpty()) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Revisa los datos del formulario.",
                    fields
            );
        }

        Optional<User> existingByEmail = userRepository.findByInstitutionalEmail(email);
        if (existingByEmail.isPresent() && existingByEmail.get().isVerified()) {
            throw new AuthException(
                    HttpStatus.CONFLICT,
                    "EMAIL_ALREADY_REGISTERED",
                    "Ya existe una cuenta verificada con ese correo institucional.",
                    Map.of("email", "Ya existe una cuenta con ese correo.")
            );
        }

        Optional<User> existingByUsername = userRepository.findByUsername(username);
        if (existingByUsername.isPresent()) {
            Long ownerId = existingByUsername.get().getId();
            Long emailOwnerId = existingByEmail.map(User::getId).orElse(null);
            if (!ownerId.equals(emailOwnerId)) {
                throw new AuthException(
                        HttpStatus.CONFLICT,
                        "USERNAME_TAKEN",
                        "Ese nombre de usuario ya está en uso.",
                        Map.of("username", "Ese nombre de usuario ya está en uso.")
                );
            }
        }

        User user = existingByEmail.orElseGet(() -> createNewStudentUser(email));
        user.setUsername(username);
        user.setFirst_name(firstName);
        user.setSecond_name(secondName.isEmpty() ? null : secondName);
        user.setFirst_lastname(firstLastname);
        user.setSecond_lastname(secondLastname);
        user.setInstitutionalEmail(email);
        user.setPasswordHash(passwordEncoder.encode(plainPassword));
        user.setSemester(request.getSemester());
        user.setVerified(false);
        if (user.getRegistrationDate() == null) {
            user.setRegistrationDate(LocalDateTime.now());
        }
        if (user.getRole() == null) {
            user.setRole(resolveStudentRole());
        }

        User savedUser = userRepository.save(user);
        long cooldownSeconds = emailVerificationService.issueVerificationCode(savedUser, true);

        return AuthResponse.pendingVerification(
                UserDto.fromEntity(savedUser),
                "Te enviamos un código de 6 dígitos a tu correo institucional para confirmar tu cuenta.",
                cooldownSeconds
        );
    }

    public AuthResponse verifyEmail(VerifyEmailRequest request) {
        User verifiedUser = emailVerificationService.verifyCode(request.getEmail(), request.getCode());
        String token = generateSessionToken();
        return AuthResponse.authenticated(
                token,
                UserDto.fromEntity(verifiedUser),
                "Correo verificado exitosamente. ¡Bienvenido a Alejandría!"
        );
    }

    public ApiMessageResponse resendVerification(ResendVerificationRequest request) {
        return emailVerificationService.resendCode(request.getEmail());
    }

    public AuthResponse login(LoginRequest request) {
        String identifier = normalize(request.getIdentifier());
        String rawPassword = request.getPassword() == null ? "" : request.getPassword();

        if (identifier.isEmpty() || rawPassword.isEmpty()) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Escribe tu usuario o tu correo y tu contraseña."
            );
        }

        User user = (identifier.contains("@")
                ? userRepository.findByInstitutionalEmail(identifier)
                : userRepository.findByUsername(identifier))
                .orElseThrow(() -> new AuthException(
                        HttpStatus.UNAUTHORIZED,
                        "INVALID_CREDENTIALS",
                        "Credenciales incorrectas. Revisa tu usuario o correo y tu contraseña."
                ));

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new AuthException(
                    HttpStatus.UNAUTHORIZED,
                    "INVALID_CREDENTIALS",
                    "Credenciales incorrectas. Revisa tu usuario o correo y tu contraseña."
            );
        }

        if (!user.isVerified()) {
            throw new AuthException(
                    HttpStatus.FORBIDDEN,
                    "EMAIL_NOT_VERIFIED",
                    "Debes confirmar tu correo institucional antes de iniciar sesión.",
                    null,
                    Map.of("email", user.getInstitutionalEmail())
            );
        }

        return AuthResponse.authenticated(generateSessionToken(), UserDto.fromEntity(user), null);
    }

    private User createNewStudentUser(String email) {
        User user = new User(
                "",
                "",
                null,
                "",
                "",
                email,
                "",
                false,
                LocalDateTime.now()
        );
        user.setRole(resolveStudentRole());
        return user;
    }

    private Role resolveStudentRole() {
        return roleRepository.findByName("ESTUDIANTE")
                .or(() -> roleRepository.findByName("STUDENT"))
                .orElseGet(() -> roleRepository.save(new Role("ESTUDIANTE", Set.of("READ", "UPLOAD"))));
    }

    private Map<String, String> validateRegistrationFields(
            String firstName,
            String firstLastname,
            String secondLastname,
            String username,
            String email,
            String password
    ) {
        Map<String, String> fields = new LinkedHashMap<>();

        if (firstName.isEmpty()) {
            fields.put("first_name", "El primer nombre es obligatorio.");
        }
        if (firstLastname.isEmpty()) {
            fields.put("first_lastname", "El primer apellido es obligatorio.");
        }
        if (secondLastname.isEmpty()) {
            fields.put("second_lastname", "El segundo apellido es obligatorio.");
        }
        if (!USERNAME_PATTERN.matcher(username).matches()) {
            fields.put("username", "Entre 3 y 20 caracteres: letras, números, punto o guion bajo.");
        }
        if (email.isEmpty() || !email.contains("@")) {
            fields.put("email", "Escribe un correo válido.");
        } else if (!email.endsWith(INSTITUTIONAL_DOMAIN)) {
            fields.put("email", "Debes usar tu correo institucional " + INSTITUTIONAL_DOMAIN + ".");
        }
        if (!isValidPassword(password)) {
            fields.put(
                    "password",
                    "Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número."
            );
        }
        return fields;
    }

    private boolean isValidPassword(String password) {
        return password.length() >= 8
                && UPPERCASE_PATTERN.matcher(password).find()
                && LOWERCASE_PATTERN.matcher(password).find()
                && DIGIT_PATTERN.matcher(password).find();
    }

    private String generateSessionToken() {
        return "alejandria-jwt-" + UUID.randomUUID();
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }
}
