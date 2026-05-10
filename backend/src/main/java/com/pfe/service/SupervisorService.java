package com.pfe.service;

import com.pfe.entity.*;
import com.pfe.enums.ApplicationStatus;
import com.pfe.enums.DocumentStatus;
import com.pfe.enums.ProjectStatus;
import com.pfe.enums.TopicStatus;
import com.pfe.exception.BadRequestException;
import com.pfe.exception.ResourceNotFoundException;
import com.pfe.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class SupervisorService {

    private final TopicRepository topicRepository;
    private final ApplicationRepository applicationRepository;
    private final ProjectRepository projectRepository;
    private final DocumentRepository documentRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats(User supervisor) {
        Map<String, Object> stats = new HashMap<>();
        
        long activeTopics = topicRepository.countByCreatedBy_IdAndStatus(supervisor.getId(), TopicStatus.APPROVED);
        long pendingTopics = topicRepository.countByCreatedBy_IdAndStatus(supervisor.getId(), TopicStatus.PENDING);
        long pendingApplications = applicationRepository.countByTopicCreatedByIdAndStatus(supervisor.getId(), ApplicationStatus.PENDING);
        long activeProjects = projectRepository.countBySupervisorIdAndStatusNot(supervisor.getId(), ProjectStatus.COMPLETED);
        
        int capacity = supervisor.getSupervisorProfile() != null ? supervisor.getSupervisorProfile().getMaxCapacity() : 5;
        double workload = capacity > 0 ? (double) activeProjects / capacity * 100 : 0;

        stats.put("activeTopics", activeTopics);
        stats.put("pendingTopics", pendingTopics);
        stats.put("pendingApplications", pendingApplications);
        stats.put("activeProjects", activeProjects);
        stats.put("capacity", capacity);
        stats.put("workload", Math.min(100, workload));
        
        return stats;
    }

    @Transactional
    public void updateInternalNotes(Long applicationId, String notes, User supervisor) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        
        if (!app.getTopic().getCreatedBy().getId().equals(supervisor.getId())) {
            throw new BadRequestException("Unauthorized");
        }
        
        app.setInternalNotes(notes);
        applicationRepository.save(app);
    }

    @Transactional
    public void reviewDocument(Long documentId, DocumentStatus status, String comment, User supervisor) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        
        if (!doc.getProject().getSupervisor().getId().equals(supervisor.getId())) {
            throw new BadRequestException("Unauthorized");
        }
        
        doc.setStatus(status);
        doc.setRevisionComment(comment);
        documentRepository.save(doc);
        
        notificationService.createNotification(
            doc.getProject().getStudent().getId(),
            "Document '" + doc.getFileName() + "' reviewed: " + status
        );
    }

    @Transactional
    public void gradeProject(Long projectId, Map<String, Object> grades, User supervisor) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        
        if (!project.getSupervisor().getId().equals(supervisor.getId())) {
            throw new BadRequestException("Unauthorized");
        }
        
        project.setReportScore(Double.valueOf(grades.get("report").toString()));
        project.setPresentationScore(Double.valueOf(grades.get("presentation").toString()));
        project.setTechnicalScore(Double.valueOf(grades.get("technical").toString()));
        project.setAttendanceScore(Double.valueOf(grades.get("attendance").toString()));
        project.setEvaluationComment(grades.get("comment").toString());
        
        double finalGrade = (project.getReportScore() + project.getPresentationScore() + 
                            project.getTechnicalScore() + project.getAttendanceScore()) / 4;
        project.setFinalGrade(finalGrade);
        project.setStatus(ProjectStatus.COMPLETED);
        project.setProgress(100);
        
        projectRepository.save(project);
        
        notificationService.createNotification(
            project.getStudent().getId(),
            "Project completed! Final grade: " + String.format("%.2f", finalGrade)
        );
    }
}
