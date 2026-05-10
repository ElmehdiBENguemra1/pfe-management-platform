package com.pfe.dto.response;

import com.pfe.enums.Level;
import com.pfe.enums.TopicType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TopicResponse {
    private Long id;
    private String title;
    private String description;
    private String requiredSkills;
    private TopicType type;
    private String duration;
    private String domain;
    private int places;
    private Level requiredLevel;
    private String descriptionPdfUrl;
    private boolean approved;
    private com.pfe.enums.TopicStatus status;
    private String rejectionComment;
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private int applicationCount;
    private String salary;
    private String workAddress;
    private String contactPerson;
    private LocalDateTime applicationDeadline;
}
