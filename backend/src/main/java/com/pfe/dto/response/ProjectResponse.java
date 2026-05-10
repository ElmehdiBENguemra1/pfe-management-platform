package com.pfe.dto.response;

import com.pfe.enums.AgreementStatus;
import com.pfe.enums.ProjectStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ProjectResponse {
    private Long id;
    private String topicTitle;
    private Long topicId;
    private UserResponse student;
    private UserResponse academicSupervisor;
    private UserResponse companySupervisor;
    private ProjectStatus status;
    private int progress;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime createdAt;
    private List<MilestoneResponse> milestones;
    private List<DocumentResponse> documents;
    private AgreementStatus agreementStatus;
    private Double companyGrade;
    private String companyComment;
}
