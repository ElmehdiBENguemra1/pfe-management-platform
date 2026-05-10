package com.pfe.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class DashboardStats {
    private long totalUsers;
    private long totalStudents;
    private long totalSupervisors;
    private long totalCompanies;
    private long totalTopics;
    private long approvedTopics;
    private long pendingTopics;
    private long totalApplications;
    private long pendingApplications;
    private long acceptedApplications;
    private long rejectedApplications;
    private long totalProjects;
    private long activeProjects;
    private long completedProjects;
    private long archivedProjects;
    
    private Map<String, Long> registrationTrend; // Date -> Count
    private Map<String, Long> applicationTrend; // Date -> Count
    private List<AnomalyDTO> anomalies;
}
