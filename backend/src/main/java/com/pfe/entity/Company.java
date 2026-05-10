package com.pfe.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "companies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "studentProfile", "supervisorProfile", "company"})
    private User user;

    @Column(nullable = false)
    private String companyName;

    private String sector;
    private String address;
    private String website;
    private String logoUrl;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private String size; // e.g., "10-50", "500+"
    private String expertise; // Comma separated tags
}
