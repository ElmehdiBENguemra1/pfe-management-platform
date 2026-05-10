package com.pfe.entity;

import com.pfe.enums.ApplicationStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "applications", "createdBy"})
    private Topic topic;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "studentProfile", "supervisorProfile", "company"})
    private User student;

    @Column(columnDefinition = "TEXT")
    private String motivationText;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status = ApplicationStatus.PENDING;

    private LocalDateTime applicationDate;

    private String cvUrl;

    @OneToOne(mappedBy = "application", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "application"})
    private Project project;

    @Column(columnDefinition = "TEXT")
    private String reviewComment;

    @Column(columnDefinition = "TEXT")
    private String internalNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "studentProfile", "supervisorProfile", "company"})
    private User reviewedBy;

    private LocalDateTime reviewedAt;

    @PrePersist
    protected void onCreate() {
        applicationDate = LocalDateTime.now();
    }
}
