package com.pfe.entity;

import com.pfe.enums.TopicStatus;
import com.pfe.enums.TopicType;
import com.pfe.enums.Level;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "topics")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Topic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 500)
    private String requiredSkills;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TopicType type;

    private String duration;

    private String domain;
    
    @Builder.Default
    private int places = 1;
    
    @Enumerated(EnumType.STRING)
    private Level requiredLevel; // L3, M1, M2, etc.
    
    private String descriptionPdfUrl;
    private String salary;
    private String workAddress;
    private String contactPerson;
    private LocalDateTime applicationDeadline;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private TopicStatus status = TopicStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String rejectionComment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "studentProfile", "supervisorProfile", "company"})
    private User createdBy;

    private LocalDateTime createdAt;

    @Builder.Default
    @OneToMany(mappedBy = "topic", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "topic"})
    private List<Application> applications = new ArrayList<>();

    public boolean isApproved() {
        return status == TopicStatus.APPROVED;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
