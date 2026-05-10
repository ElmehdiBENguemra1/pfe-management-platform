package com.pfe.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private String content;
    private boolean read;
    private LocalDateTime createdAt;
}
