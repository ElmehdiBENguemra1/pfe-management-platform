package com.pfe.entity;

import com.pfe.enums.AgreementStatus;
import com.pfe.enums.ProjectStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", unique = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "project"})
    private Application application;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "projects", "applications"})
    private Topic topic;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "studentProfile", "supervisorProfile", "company"})
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "studentProfile", "supervisorProfile", "company"})
    private User supervisor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "user"})
    private Company company;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectStatus status = ProjectStatus.NOT_STARTED;

    @Builder.Default
    @Column(nullable = false)
    private int progress = 0;

    @Builder.Default
    private boolean archived = false;

    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime createdAt;

    // Evaluation fields
    private Double reportScore;
    private Double presentationScore;
    private Double technicalScore;
    private Double attendanceScore;
    private Double finalGrade;
    
    @Column(columnDefinition = "TEXT")
    private String evaluationComment;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AgreementStatus agreementStatus = AgreementStatus.PENDING;

    private Double companyGrade;
    @Column(columnDefinition = "TEXT")
    private String companyComment;

    @Builder.Default
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Milestone> milestones = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Document> documents = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
