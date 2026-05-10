package com.pfe.service;

import com.pfe.entity.User;
import com.pfe.dto.request.MilestoneRequest;
import com.pfe.dto.response.MilestoneResponse;
import com.pfe.entity.Milestone;
import com.pfe.entity.Project;
import com.pfe.enums.MilestoneStatus;
import com.pfe.exception.ResourceNotFoundException;
import com.pfe.repository.MilestoneRepository;
import com.pfe.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import com.pfe.enums.Role;
import com.pfe.enums.TopicType;
import com.pfe.util.ProjectAccessHelper;
import com.pfe.exception.BadRequestException;
import org.springframework.security.access.AccessDeniedException;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class MilestoneService {

    private final MilestoneRepository milestoneRepository;
    private final ProjectRepository projectRepository;
    private final NotificationService notificationService;
    private final ProjectAccessHelper projectAccessHelper;
    private final ChatService chatService;

    public List<MilestoneResponse> getProjectMilestones(Long projectId, User user) {
        projectAccessHelper.getProjectAndCheckAccess(projectId, user);
        return milestoneRepository.findByProjectIdOrderByDueDateAsc(projectId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MilestoneResponse createMilestone(Long projectId, MilestoneRequest request, User user) {
        Project project = projectAccessHelper.getProjectAndCheckAccess(projectId, user);

        // FIX 1.4: CREATE permissions
        if (user.getRole() == Role.ADMIN) {
            throw new AccessDeniedException("Admin cannot create milestones.");
        }
        if (user.getRole() == Role.COMPANY) {
            if (project.getTopic().getType() != TopicType.INTERNSHIP) {
                throw new BadRequestException("Companies can only create milestones for internship projects.");
            }
        }
        if (user.getRole() == Role.STUDENT) {
            throw new AccessDeniedException("Students cannot create milestones.");
        }

        Milestone milestone = Milestone.builder()
                .project(project)
                .title(request.getTitle())
                .description(request.getDescription())
                .dueDate(request.getDueDate() != null ? LocalDate.parse(request.getDueDate()) : null)
                .status(MilestoneStatus.PENDING)
                .build();

        milestone = milestoneRepository.save(milestone);

        // Notify the student
        notificationService.createNotification(
                project.getStudent().getId(),
                "New milestone added to your project: \"" + request.getTitle() + "\""
        );

        return mapToResponse(milestone);
    }

    @Transactional
    public MilestoneResponse updateMilestone(Long id, MilestoneRequest request, User user) {
        Milestone milestone = milestoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found"));

        projectAccessHelper.assertUserBelongsToProject(milestone.getProject(), user);

        // FIX 1.3: Remove STUDENT from update permission
        if (user.getRole() == Role.STUDENT) {
            throw new AccessDeniedException("Students cannot modify milestones. Use the completion endpoint instead.");
        }

        if (request.getTitle() != null) milestone.setTitle(request.getTitle());
        if (request.getDescription() != null) milestone.setDescription(request.getDescription());
        if (request.getDueDate() != null) milestone.setDueDate(LocalDate.parse(request.getDueDate()));
        if (request.getStatus() != null) milestone.setStatus(request.getStatus());

        milestone = milestoneRepository.save(milestone);

        // Update project progress based on milestones
        updateProjectProgress(milestone.getProject());

        return mapToResponse(milestone);
    }

    @Transactional
    public void completeMilestone(Long id, User user) {
        Milestone milestone = milestoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found"));

        projectAccessHelper.assertUserBelongsToProject(milestone.getProject(), user);

        if (user.getRole() != Role.STUDENT) {
            throw new AccessDeniedException("Only students can mark milestones as complete.");
        }

        if (!milestone.getProject().getStudent().getId().equals(user.getId())) {
            throw new AccessDeniedException("You are not assigned to this project.");
        }

        milestone.setStatus(MilestoneStatus.COMPLETED);
        milestoneRepository.save(milestone);

        // Update project progress
        updateProjectProgress(milestone.getProject());

        // Generate System Message
        chatService.createSystemMessage(
                milestone.getProject().getId(),
                com.pfe.enums.MessageType.MILESTONE_REF,
                milestone.getId(),
                user.getFirstName() + " a marqué \"" + milestone.getTitle() + "\" comme terminé"
        );

        // Notify the supervisor
        if (milestone.getProject().getSupervisor() != null) {
            notificationService.createNotification(
                    milestone.getProject().getSupervisor().getId(),
                    "Student " + user.getFirstName() + " marked milestone \"" + milestone.getTitle() + "\" as completed."
            );
        }
    }

    @Transactional
    public void deleteMilestone(Long id, User user) {
        Milestone milestone = milestoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found"));
        
        projectAccessHelper.assertUserBelongsToProject(milestone.getProject(), user);
        
        if (user.getRole() == Role.STUDENT) {
            throw new AccessDeniedException("Students cannot delete milestones.");
        }

        milestoneRepository.delete(milestone);
        updateProjectProgress(milestone.getProject());
    }

    private void updateProjectProgress(Project project) {
        List<Milestone> milestones = milestoneRepository.findByProjectId(project.getId());
        if (milestones.isEmpty()) {
            project.setProgress(0);
            projectRepository.save(project);
            return;
        }

        long completed = milestones.stream()
                .filter(m -> m.getStatus() == MilestoneStatus.COMPLETED)
                .count();

        int progress = (int) ((completed * 100) / milestones.size());
        project.setProgress(progress);
        projectRepository.save(project);
    }

    private MilestoneResponse mapToResponse(Milestone milestone) {
        return MilestoneResponse.builder()
                .id(milestone.getId())
                .projectId(milestone.getProject().getId())
                .title(milestone.getTitle())
                .description(milestone.getDescription())
                .dueDate(milestone.getDueDate())
                .status(milestone.getStatus())
                .build();
    }
}
