package com.pfe.dto.response;

import com.pfe.enums.MilestoneStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class MilestoneResponse {
    private Long id;
    private Long projectId;
    private String title;
    private String description;
    private LocalDate dueDate;
    private MilestoneStatus status;
}
