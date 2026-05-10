package com.pfe.dto.request;

import com.pfe.enums.Level;
import com.pfe.enums.Role;
import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String phone;
    private String password;
    private String firstName;
    private String lastName;
    private Role role;

    // Student-specific fields
    private String studentId;
    private String department;
    private Level level;

    // Supervisor-specific fields
    private String specialization;

    // Company-specific fields
    private String companyName;
    private String sector;
    private String address;
    private String website;
}
