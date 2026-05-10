package com.pfe.dto.request;

import com.pfe.enums.Level;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProfileUpdateRequest {
    private String firstName;
    private String lastName;
    private String phone;

    // Student fields
    private String studentId;
    private String department;
    private Level level;
    private String bio;
    private String skills;
    private String githubUrl;
    private String linkedinUrl;

    // Supervisor fields
    private String specialization;

    // Company fields
    private String companyName;
    private String sector;
    private String website;
    private String address;
}
