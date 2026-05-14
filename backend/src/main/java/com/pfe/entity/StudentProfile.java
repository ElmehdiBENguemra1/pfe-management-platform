package com.pfe.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.pfe.enums.Level;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "student_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "studentProfile", "supervisorProfile", "company"})
    private User user;

    private String studentId;
    private String department;
    @Enumerated(EnumType.STRING)
    private Level level;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(columnDefinition = "TEXT")
    private String skills; // Stored as comma-separated tags or JSON

    private String cvUrl;
}
