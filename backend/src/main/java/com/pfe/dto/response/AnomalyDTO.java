package com.pfe.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AnomalyDTO {
    private String type;
    private String message;
    private String entityType;
    private Long entityId;
}
