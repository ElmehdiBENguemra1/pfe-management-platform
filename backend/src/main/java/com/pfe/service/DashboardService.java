package com.pfe.service;

import com.pfe.dto.response.AnomalyDTO;
import com.pfe.dto.response.DashboardStats;
import com.pfe.enums.ApplicationStatus;
import com.pfe.enums.ProjectStatus;
import com.pfe.enums.Role;
import com.pfe.enums.TopicStatus;
import com.pfe.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final TopicRepository topicRepository;
    private final ApplicationRepository applicationRepository;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public DashboardStats getStats() {

        return DashboardStats.builder()
                .totalUsers(userRepository.count())
                .totalStudents(userRepository.countByRole(Role.STUDENT))
                .totalSupervisors(userRepository.countByRole(Role.SUPERVISOR))
                .totalCompanies(userRepository.countByRole(Role.COMPANY))
                .totalTopics(topicRepository.count())
                .approvedTopics(topicRepository.countByStatus(TopicStatus.APPROVED))
                .pendingTopics(topicRepository.countByStatus(TopicStatus.PENDING))
                .totalApplications(applicationRepository.count())
                .pendingApplications(applicationRepository.countByStatus(ApplicationStatus.PENDING))
                .acceptedApplications(applicationRepository.countByStatus(ApplicationStatus.ACCEPTED))
                .rejectedApplications(applicationRepository.countByStatus(ApplicationStatus.REJECTED))
                .totalProjects(projectRepository.count())
                .activeProjects(projectRepository.countByStatus(ProjectStatus.IN_PROGRESS))
                .completedProjects(projectRepository.countByStatus(ProjectStatus.COMPLETED))
                .archivedProjects(projectRepository.countByArchivedTrue())
                .registrationTrend(getRegistrationTrend())
                .applicationTrend(getApplicationTrend())
                .anomalies(detectAnomalies())
                .build();
    }

    private Map<String, Long> getRegistrationTrend() {
        Map<String, Long> trend = new LinkedHashMap<>();
        for (int i = 29; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.atTime(LocalTime.MAX);
            trend.put(date.toString(), userRepository.countByCreatedAtBetween(start, end));
        }
        return trend;
    }

    private Map<String, Long> getApplicationTrend() {
        Map<String, Long> trend = new LinkedHashMap<>();
        for (int i = 29; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.atTime(LocalTime.MAX);
            trend.put(date.toString(), applicationRepository.countByApplicationDateBetween(start, end));
        }
        return trend;
    }

    private List<AnomalyDTO> detectAnomalies() {
        List<AnomalyDTO> anomalies = new ArrayList<>();

        // 1. Pending topics older than 7 days
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        topicRepository.findByStatusAndCreatedAtBefore(TopicStatus.PENDING, sevenDaysAgo).forEach(topic -> {
            anomalies.add(AnomalyDTO.builder()
                    .type("STALE_TOPIC")
                    .message("Topic \"" + topic.getTitle() + "\" is pending for more than 7 days")
                    .entityType("TOPIC")
                    .entityId(topic.getId())
                    .build());
        });

        // 2. Projects with 0% progress but started > 15 days ago
        LocalDateTime fifteenDaysAgo = LocalDateTime.now().minusDays(15);
        // Assuming we have a way to find projects by startDate (which is LocalDate)
        // I'll simplify for now
        projectRepository.findByStatus(ProjectStatus.IN_PROGRESS).stream()
                .filter(p -> p.getProgress() == 0 && p.getCreatedAt().isBefore(fifteenDaysAgo))
                .forEach(p -> {
                    anomalies.add(AnomalyDTO.builder()
                            .type("INACTIVE_PROJECT")
                            .message("Project \"" + p.getTopic().getTitle() + "\" has no progress for 15 days")
                            .entityType("PROJECT")
                            .entityId(p.getId())
                            .build());
                });

        return anomalies;
    }
}
