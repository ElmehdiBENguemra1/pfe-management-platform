package com.pfe.dto.response;

import com.pfe.enums.Level;
import com.pfe.enums.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserResponse {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private Role role;
    private String status;
    private boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;

    // Student fields
    private String studentId;
    private String department;
    private Level level;
    private String bio;
    private String skills;
    private String cvUrl;
    private String githubUrl;
    private String linkedinUrl;

    // Supervisor fields
    private String specialization;

    // Company fields
    private String companyName;
    private String sector;
    private String address;
    private String website;
}
