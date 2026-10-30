package com.backend.service;

import com.backend.repository.UserRepository;
import com.backend.domain.identity.User;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    //regla de negocio:
    public User registerUser(User newUser) {
        //validación de que no existan usuarios con el mismo usuario
        boolean exists = userRepository.existsByInstitutionalEmail(newUser.getInstitutionalEmail());

        if (exists) {
            // si ya existe sale error
            throw new IllegalArgumentException("El correo institucional ya está registrado.");
        }

        // aquí irá la encriptación de la contraseña

        // extrae la contraseña que entra en otro lado (segundo plano pues)
        String plainPassword = newUser.getPasswordHash();

        // se encripta con Bcrypt @bean
        String encryptedPassword = passwordEncoder.encode(plainPassword);

        // se sobrescribe antes de guardarse
        newUser.setPasswordHash(encryptedPassword);

        //aquí se guarda directamente en la base de datos método: save() de Spring Data JPA en la interfaz

        return userRepository.save(newUser);
    }
}