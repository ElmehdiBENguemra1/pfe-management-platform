package com.pfe.service;

import com.pfe.dto.request.ProjectUpdateRequest;
import com.pfe.dto.response.DocumentResponse;
import com.pfe.dto.response.MilestoneResponse;
import com.pfe.dto.response.ProjectResponse;
import com.pfe.entity.Project;
import com.pfe.entity.User;
import com.pfe.enums.AgreementStatus;
import com.pfe.enums.ProjectStatus;
import com.pfe.enums.Role;
import com.pfe.exception.BadRequestException;
import com.pfe.exception.ResourceNotFoundException;
import com.pfe.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsForUser(User user) {
        List<Project> projects;
        switch (user.getRole()) {
            case STUDENT -> projects = projectRepository.findByStudentId(user.getId());
            case SUPERVISOR -> projects = projectRepository.findBySupervisorId(user.getId());
            case COMPANY -> {
                if (user.getCompany() != null) {
                    projects = projectRepository.findByCompanyId(user.getCompany().getId());
                } else {
                    projects = Collections.emptyList();
                }
            }
            default -> projects = projectRepository.findAll();
        }
        return projects.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        return mapToResponse(project);
    }

    @Transactional
    public ProjectResponse updateProject(Long id, ProjectUpdateRequest request, User currentUser) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        // Only admin or the assigned supervisor can update
        if (currentUser.getRole() != Role.ADMIN &&
                !project.getSupervisor().getId().equals(currentUser.getId())) {
            throw new BadRequestException("Only admin or the assigned supervisor can update this project");
        }

        if (request.getStatus() != null) {
            project.setStatus(request.getStatus());
        }
        if (request.getProgress() != null) {
            project.setProgress(request.getProgress());
            // Auto-update status based on progress
            if (request.getProgress() == 100) {
                project.setStatus(ProjectStatus.COMPLETED);
            } else if (request.getProgress() > 0 && project.getStatus() == ProjectStatus.NOT_STARTED) {
                project.setStatus(ProjectStatus.IN_PROGRESS);
            }
        }
        if (request.getStartDate() != null) {
            project.setStartDate(LocalDate.parse(request.getStartDate()));
        }
        if (request.getEndDate() != null) {
            project.setEndDate(LocalDate.parse(request.getEndDate()));
        }

        project = projectRepository.save(project);

        // Notify the student about project update
        notificationService.createNotification(
                project.getStudent().getId(),
                "Your project \"" + project.getTopic().getTitle() + "\" has been updated. Status: " +
                        project.getStatus().name()
        );

        return mapToResponse(project);
    }

    @Transactional
    public void signAgreement(Long projectId, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        AgreementStatus current = project.getAgreementStatus();

        if (currentUser.getRole() == Role.STUDENT && current == AgreementStatus.PENDING) {
            project.setAgreementStatus(AgreementStatus.STUDENT_SIGNED);
        } else if (currentUser.getRole() == Role.COMPANY && current == AgreementStatus.STUDENT_SIGNED) {
            project.setAgreementStatus(AgreementStatus.COMPANY_SIGNED);
            // Both signed → mark as completed
            project.setAgreementStatus(AgreementStatus.COMPLETED);
        } else {
            throw new BadRequestException("Cannot sign agreement in current state: " + current);
        }

        projectRepository.save(project);

        notificationService.createNotification(
                project.getStudent().getId(),
                "Convention de stage mise à jour : " + project.getAgreementStatus()
        );
    }

    @Transactional
    public void saveCompanyEvaluation(Long projectId, Map<String, Object> evaluation, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (currentUser.getRole() != Role.COMPANY) {
            throw new BadRequestException("Only company users can submit company evaluations");
        }

        project.setCompanyGrade(Double.valueOf(evaluation.get("grade").toString()));
        project.setCompanyComment(evaluation.getOrDefault("comment", "").toString());
        projectRepository.save(project);

        // Notify supervisor
        notificationService.createNotification(
                project.getSupervisor().getId(),
                "L'entreprise a soumis son évaluation pour le projet \"" + project.getTopic().getTitle() + "\""
        );
    }

    @Transactional
    public void gradeProject(Long projectId, Map<String, Object> grades, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (currentUser.getRole() != Role.ADMIN && !project.getSupervisor().getId().equals(currentUser.getId())) {
            throw new BadRequestException("Only admin or the assigned supervisor can grade this project");
        }

        project.setReportScore(Double.valueOf(grades.getOrDefault("report", 0).toString()));
        project.setPresentationScore(Double.valueOf(grades.getOrDefault("presentation", 0).toString()));
        project.setTechnicalScore(Double.valueOf(grades.getOrDefault("technical", 0).toString()));
        project.setAttendanceScore(Double.valueOf(grades.getOrDefault("attendance", 0).toString()));
        project.setEvaluationComment(grades.getOrDefault("comment", "").toString());
        
        // Calculate final grade
        double finalGrade = (project.getReportScore() * 0.4) + 
                           (project.getPresentationScore() * 0.3) + 
                           (project.getTechnicalScore() * 0.2) + 
                           (project.getAttendanceScore() * 0.1);
        
        project.setFinalGrade(finalGrade);
        project.setStatus(ProjectStatus.COMPLETED);
        project.setProgress(100);
        
        projectRepository.save(project);

        notificationService.createNotification(
                project.getStudent().getId(),
                "Votre projet a été évalué. Note finale : " + String.format("%.2f", finalGrade)
        );
    }

    private ProjectResponse mapToResponse(Project project) {
        List<MilestoneResponse> milestones = project.getMilestones() != null ?
                project.getMilestones().stream()
                        .map(m -> MilestoneResponse.builder()
                                .id(m.getId())
                                .projectId(project.getId())
                                .title(m.getTitle())
                                .description(m.getDescription())
                                .dueDate(m.getDueDate())
                                .status(m.getStatus())
                                .build())
                        .collect(Collectors.toList()) : Collections.emptyList();

        List<DocumentResponse> documents = project.getDocuments() != null ?
                project.getDocuments().stream()
                        .map(d -> DocumentResponse.builder()
                                .id(d.getId())
                                .projectId(project.getId())
                                .fileName(d.getFileName())
                                .documentType(d.getDocumentType())
                                .uploadedByName(d.getUploadedBy().getFirstName() + " " + d.getUploadedBy().getLastName())
                                .uploadedById(d.getUploadedBy().getId())
                                .uploadedAt(d.getUploadedAt())
                                .status(d.getStatus())
                                .revisionComment(d.getRevisionComment())
                                .build())
                        .collect(Collectors.toList()) : Collections.emptyList();

        return ProjectResponse.builder()
                .id(project.getId())
                .topicTitle(project.getTopic().getTitle())
                .topicId(project.getTopic().getId())
                .student(mapToUserResponse(project.getStudent()))
                .academicSupervisor(mapToUserResponse(project.getSupervisor()))
                .companySupervisor(project.getCompany() != null ? mapToUserResponse(project.getCompany().getUser()) : null)
                .status(project.getStatus())
                .progress(project.getProgress())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .createdAt(project.getCreatedAt())
                .milestones(milestones)
                .documents(documents)
                .agreementStatus(project.getAgreementStatus())
                .companyGrade(project.getCompanyGrade())
                .companyComment(project.getCompanyComment())
                .build();
    }

    private com.pfe.dto.response.UserResponse mapToUserResponse(User user) {
        if (user == null) return null;
        com.pfe.dto.response.UserResponse.UserResponseBuilder builder = com.pfe.dto.response.UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .role(user.getRole())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt());

        if (user.getRole() == Role.STUDENT && user.getStudentProfile() != null) {
            builder.studentId(user.getStudentProfile().getStudentId())
                    .department(user.getStudentProfile().getDepartment())
                    .level(user.getStudentProfile().getLevel());
        } else if (user.getRole() == Role.SUPERVISOR && user.getSupervisorProfile() != null) {
            builder.department(user.getSupervisorProfile().getDepartment())
                    .specialization(user.getSupervisorProfile().getSpecialization());
        } else if (user.getRole() == Role.COMPANY && user.getCompany() != null) {
            builder.companyName(user.getCompany().getCompanyName())
                    .sector(user.getCompany().getSector())
                    .address(user.getCompany().getAddress())
                    .website(user.getCompany().getWebsite());
        }

        return builder.build();
    }
}
