package com.pfe.dto.request;

import com.pfe.enums.MessageType;
import lombok.Data;

@Data
public class ChatMessageRequest {
    private String content;
    private MessageType type = MessageType.TEXT;
}
