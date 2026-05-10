package com.pfe.dto.response;

import com.pfe.enums.DocumentType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DocumentResponse {
    private Long id;
    private Long projectId;
    private String fileName;
    private DocumentType documentType;
    private com.pfe.enums.DocumentStatus status;
    private String revisionComment;
    private String uploadedByName;
    private Long uploadedById;
    private LocalDateTime uploadedAt;
}
