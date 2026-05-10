package com.pfe.service;

import com.pfe.dto.request.ApplicationRequest;
import com.pfe.dto.response.ApplicationResponse;
import com.pfe.entity.Application;
import com.pfe.entity.Project;
import com.pfe.entity.Topic;
import com.pfe.entity.User;
import com.pfe.enums.ApplicationStatus;
import com.pfe.enums.ProjectStatus;
import com.pfe.enums.Role;
import com.pfe.exception.BadRequestException;
import com.pfe.exception.ResourceNotFoundException;
import com.pfe.repository.ApplicationRepository;
import com.pfe.repository.ProjectRepository;
import com.pfe.repository.TopicRepository;
import com.pfe.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final TopicRepository topicRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getAllApplications() {
        return applicationRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getStudentApplications(Long studentId) {
        return applicationRepository.findByStudentId(studentId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getApplicationsByTopic(Long topicId) {
        return applicationRepository.findByTopicId(topicId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getApplicationsForSupervisor(Long supervisorId) {
        return applicationRepository.findByTopicCreatedById(supervisorId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ApplicationResponse createApplication(ApplicationRequest request, User student) {
        if (student.getRole() != Role.STUDENT) {
            throw new BadRequestException("Only students can apply to topics");
        }

        Topic topic = topicRepository.findById(request.getTopicId())
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found"));

        if (!topic.isApproved()) {
            throw new BadRequestException("Cannot apply to an unapproved topic");
        }

        if (applicationRepository.existsByStudentIdAndTopicId(student.getId(), topic.getId())) {
            throw new BadRequestException("You have already applied to this topic");
        }

        Application application = Application.builder()
                .topic(topic)
                .student(student)
                .motivationText(request.getMotivationText())
                .status(ApplicationStatus.PENDING)
                .build();

        application = applicationRepository.save(application);

        // Notify the topic creator
        notificationService.createNotification(
                topic.getCreatedBy().getId(),
                "New application from " + student.getFirstName() + " " + student.getLastName() +
                        " for topic \"" + topic.getTitle() + "\""
        );

        return mapToResponse(application);
    }

    @Transactional
    public ApplicationResponse updateApplicationStatus(Long id, ApplicationStatus status, User currentUser) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        // SECURITY CHECK: Only Admin or the Topic Creator (Supervisor/Company) can approve/reject
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean isTopicOwner = application.getTopic().getCreatedBy().getId().equals(currentUser.getId());

        if (!isAdmin && !isTopicOwner) {
            throw new BadRequestException("You are not authorized to review this application");
        }

        application.setStatus(status);
        application = applicationRepository.save(application);

        // If accepted, create a project
        if (status == ApplicationStatus.ACCEPTED) {
            createProjectFromApplication(application, currentUser);
        }

        // Notify the student
        notificationService.createNotification(
                application.getStudent().getId(),
                "Your application for \"" + application.getTopic().getTitle() +
                        "\" has been " + status.name().toLowerCase() + "."
        );

        return mapToResponse(application);
    }

    private void createProjectFromApplication(Application application, User currentUser) {
        // Determine the supervisor
        User supervisor;
        if (currentUser.getRole() == Role.SUPERVISOR) {
            supervisor = currentUser;
        } else {
            // If admin accepts, use the topic creator if they are a supervisor
            supervisor = application.getTopic().getCreatedBy();
            if (supervisor.getRole() != Role.SUPERVISOR) {
                // Find any supervisor as fallback
                List<User> supervisors = userRepository.findByRole(Role.SUPERVISOR);
                if (!supervisors.isEmpty()) {
                    supervisor = supervisors.get(0);
                } else {
                    supervisor = currentUser; // fallback to admin
                }
            }
        }

        Project project = Project.builder()
                .application(application)
                .topic(application.getTopic())
                .student(application.getStudent())
                .supervisor(supervisor)
                .status(ProjectStatus.NOT_STARTED)
                .progress(0)
                .startDate(LocalDate.now())
                .build();

        // Set company if topic was created by a company user
        if (application.getTopic().getCreatedBy().getRole() == Role.COMPANY &&
                application.getTopic().getCreatedBy().getCompany() != null) {
            project.setCompany(application.getTopic().getCreatedBy().getCompany());
        }

        projectRepository.save(project);

        // Notify the supervisor
        notificationService.createNotification(
                supervisor.getId(),
                "You have been assigned as supervisor for the project: \"" +
                        application.getTopic().getTitle() + "\""
        );
    }

    @Transactional
    public void cancelApplication(Long id, User student) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!application.getStudent().getId().equals(student.getId())) {
            throw new BadRequestException("You can only cancel your own applications");
        }

        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new BadRequestException("Can only cancel pending applications");
        }

        application.setStatus(ApplicationStatus.CANCELLED);
        applicationRepository.save(application);
    }

    private ApplicationResponse mapToResponse(Application application) {
        return ApplicationResponse.builder()
                .id(application.getId())
                .topicId(application.getTopic().getId())
                .topicTitle(application.getTopic().getTitle())
                .studentId(application.getStudent().getId())
                .studentName(application.getStudent().getFirstName() + " " + application.getStudent().getLastName())
                .studentEmail(application.getStudent().getEmail())
                .studentCvUrl(application.getStudent().getStudentProfile() != null ? application.getStudent().getStudentProfile().getCvUrl() : null)
                .motivationText(application.getMotivationText())
                .topicType(application.getTopic().getType().name())
                .topicCreatedByName(application.getTopic().getCreatedBy().getFirstName() + " " + application.getTopic().getCreatedBy().getLastName())
                .status(application.getStatus())
                .applicationDate(application.getApplicationDate())
                .build();
    }
}
