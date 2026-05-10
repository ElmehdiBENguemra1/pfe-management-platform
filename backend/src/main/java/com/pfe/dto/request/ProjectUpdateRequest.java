package com.pfe.dto.request;

import com.pfe.enums.ProjectStatus;
import lombok.Data;

@Data
public class ProjectUpdateRequest {
    private Long supervisorId;
    private Long companyId;
    private ProjectStatus status;
    private Integer progress;
    private String startDate;
    private String endDate;
}
