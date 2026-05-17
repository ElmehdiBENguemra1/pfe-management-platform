package com.pfe.service;

import com.pfe.config.JwtService;
import com.pfe.dto.request.LoginRequest;
import com.pfe.dto.request.RegisterRequest;
import com.pfe.dto.response.AuthResponse;
import com.pfe.dto.response.UserResponse;
import com.pfe.entity.*;
import com.pfe.enums.Role;
import com.pfe.exception.BadRequestException;
import com.pfe.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import com.pfe.entity.PasswordResetToken;
import com.pfe.repository.PasswordResetTokenRepository;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final PasswordResetTokenRepository tokenRepository;

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists: " + request.getEmail());
        }

        // Backend Password Strength Validation
        if (!isPasswordStrong(request.getPassword())) {
            throw new BadRequestException("Password does not meet security requirements.");
        }

        User user = User.builder()
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(request.getRole())
                .status(com.pfe.enums.UserStatus.ACTIVE)
                .build();

        user = userRepository.save(user);

        // Create role-specific profile
        switch (request.getRole()) {
            case STUDENT -> {
                StudentProfile profile = StudentProfile.builder()
                        .user(user)
                        .studentId(request.getStudentId())
                        .department(request.getDepartment())
                        .level(request.getLevel())
                        .build();
                user.setStudentProfile(profile);
            }
            case SUPERVISOR -> {
                SupervisorProfile profile = SupervisorProfile.builder()
                        .user(user)
                        .department(request.getDepartment())
                        .specialization(request.getSpecialization())
                        .build();
                user.setSupervisorProfile(profile);
            }
            case COMPANY -> {
                Company company = Company.builder()
                        .user(user)
                        .companyName(request.getCompanyName())
                        .sector(request.getSector())
                        .address(request.getAddress())
                        .website(request.getWebsite())
                        .build();
                user.setCompany(company);
            }
            default -> { /* Admin has no extra profile */ }
        }

        user = userRepository.save(user);
        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .build();
    }

    public UserResponse getCurrentUser(User user) {
        UserResponse.UserResponseBuilder builder = UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .githubUrl(user.getGithubUrl())
                .linkedinUrl(user.getLinkedinUrl());

        if (user.getRole() == Role.STUDENT && user.getStudentProfile() != null) {
            builder.studentId(user.getStudentProfile().getStudentId())
                    .department(user.getStudentProfile().getDepartment())
                    .level(user.getStudentProfile().getLevel())
                    .bio(user.getStudentProfile().getBio())
                    .skills(user.getStudentProfile().getSkills())
                    .cvUrl(user.getStudentProfile().getCvUrl());
        } else if (user.getRole() == Role.SUPERVISOR && user.getSupervisorProfile() != null) {
            builder.department(user.getSupervisorProfile().getDepartment())
                    .specialization(user.getSupervisorProfile().getSpecialization());
        } else if (user.getRole() == Role.COMPANY && user.getCompany() != null) {
            builder.companyName(user.getCompany().getCompanyName())
                    .sector(user.getCompany().getSector())
                    .address(user.getCompany().getAddress())
                    .website(user.getCompany().getWebsite());
        }

        return builder.build();
    }

    @Transactional
    public UserResponse updateProfile(User principal, com.pfe.dto.request.ProfileUpdateRequest request) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new com.pfe.exception.ResourceNotFoundException("User not found"));

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getGithubUrl() != null) user.setGithubUrl(request.getGithubUrl());
        if (request.getLinkedinUrl() != null) user.setLinkedinUrl(request.getLinkedinUrl());

        if (user.getRole() == Role.STUDENT && user.getStudentProfile() != null) {
            StudentProfile profile = user.getStudentProfile();
            if (request.getStudentId() != null) profile.setStudentId(request.getStudentId());
            if (request.getDepartment() != null) profile.setDepartment(request.getDepartment());
            if (request.getLevel() != null) profile.setLevel(request.getLevel());
            if (request.getBio() != null) profile.setBio(request.getBio());
            if (request.getSkills() != null) profile.setSkills(request.getSkills());
        } else if (user.getRole() == Role.SUPERVISOR && user.getSupervisorProfile() != null) {
            SupervisorProfile profile = user.getSupervisorProfile();
            if (request.getDepartment() != null) profile.setDepartment(request.getDepartment());
            if (request.getSpecialization() != null) profile.setSpecialization(request.getSpecialization());
        } else if (user.getRole() == Role.COMPANY && user.getCompany() != null) {
            Company company = user.getCompany();
            if (request.getCompanyName() != null) company.setCompanyName(request.getCompanyName());
            if (request.getSector() != null) company.setSector(request.getSector());
            if (request.getAddress() != null) company.setAddress(request.getAddress());
            if (request.getWebsite() != null) company.setWebsite(request.getWebsite());
        }

        user = userRepository.save(user);
        return getCurrentUser(user);
    }

    @Transactional
    public void updateStudentCv(User user, String cvUrl) {
        if (user.getRole() == Role.STUDENT && user.getStudentProfile() != null) {
            user.getStudentProfile().setCvUrl(cvUrl);
            userRepository.save(user);
        }
    }

    @Transactional
    public void requestPasswordReset(String identifier) {
        // Here we simulate searching by email or phone. Since we added phone, we'll check both if needed.
        // For simplicity, we check email first.
        Optional<User> userOpt = userRepository.findByEmail(identifier);
        
        // If not found by email, search by phone
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByPhone(identifier);
        }
        
        if (userOpt.isEmpty()) {
            throw new BadRequestException("Aucun compte n'est reconnu avec cet identifiant.");
        }

        User user = userOpt.get();
        String token = UUID.randomUUID().toString().substring(0, 6).toUpperCase(); // Simple 6-char OTP
        
        // Persist to DB
        tokenRepository.deleteByEmail(user.getEmail()); // Clean old tokens for this user
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .email(user.getEmail())
                .expiryDate(LocalDateTime.now().plusMinutes(15)) // Valid for 15 mins
                .build();
        tokenRepository.save(resetToken);

        // Send Real Email
        emailService.sendPasswordResetEmail(
                user.getEmail(),
                user.getFirstName(),
                token
        );
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Code de réinitialisation invalide."));

        if (resetToken.isExpired()) {
            tokenRepository.delete(resetToken);
            throw new BadRequestException("Ce code a expiré (limite de 15 minutes).");
        }

        if (!isPasswordStrong(newPassword)) {
            throw new BadRequestException("Le nouveau mot de passe ne respecte pas les critères de sécurité.");
        }

        User user = userRepository.findByEmail(resetToken.getEmail())
                .orElseThrow(() -> new BadRequestException("Utilisateur non trouvé."));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Remove token after successful use
        tokenRepository.delete(resetToken);
    }

    private boolean isPasswordStrong(String password) {
        if (password == null || password.length() < 8) return false;
        boolean hasUppercase = !password.equals(password.toLowerCase());
        boolean hasLowercase = !password.equals(password.toUpperCase());
        boolean hasNumber = password.matches(".*\\d.*");
        boolean hasSpecial = password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*");
        return hasUppercase && hasLowercase && hasNumber && hasSpecial;
    }
}
