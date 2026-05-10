package com.pfe.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "supervisor_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupervisorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "supervisorProfile", "studentProfile", "company"})
    private User user;

    private String department;
    private String specialization;

    @Builder.Default
    private int maxCapacity = 5;
}
