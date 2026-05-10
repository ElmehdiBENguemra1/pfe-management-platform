package com.pfe.dto.response;

import com.pfe.enums.ApplicationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ApplicationResponse {
    private Long id;
    private Long topicId;
    private String topicTitle;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String studentCvUrl;
    private String motivationText;
    private String topicType;
    private String topicCreatedByName;
    private ApplicationStatus status;
    private LocalDateTime applicationDate;
}
