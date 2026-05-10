package com.pfe.dto.request;

import com.pfe.enums.Level;
import com.pfe.enums.TopicType;
import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class TopicRequest {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    private String requiredSkills;

    @NotNull(message = "Type is required")
    private TopicType type;

    private String duration;
    
    @NotBlank(message = "Domain is required")
    private String domain;

    private int places = 1;

    @NotNull(message = "Required level is required")
    private Level requiredLevel;

    private String descriptionPdfUrl;
    private String salary;
    private String workAddress;
    private String contactPerson;
    private String applicationDeadline;
}
