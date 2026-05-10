package com.pfe.dto.request;

import com.pfe.enums.MilestoneStatus;
import lombok.Data;

@Data
public class MilestoneRequest {
    private String title;
    private String description;
    private String dueDate;
    private MilestoneStatus status;
}
