package com.pfe.dto.response;

import com.pfe.enums.MessageType;
import com.pfe.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {
    private Long id;
    private Long projectId;
    private Long senderId;
    private String senderName;
    private Role senderRole;
    private String content;
    private MessageType type;
    private Long referenceId;
    private LocalDateTime sentAt;
    private Set<Long> readBy;
}
