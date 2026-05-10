package com.pfe.controller;

import com.pfe.dto.request.ChatMessageRequest;
import com.pfe.dto.response.ChatMessageResponse;
import com.pfe.entity.User;
import com.pfe.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@RestController
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/api/projects/{projectId}/messages")
    public ResponseEntity<Page<ChatMessageResponse>> getMessages(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size,
            @AuthenticationPrincipal User user) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(chatService.getProjectMessages(projectId, user, pageable));
    }

    @MessageMapping("/project/{projectId}/chat")
    public void sendMessage(
            @DestinationVariable Long projectId,
            @Payload ChatMessageRequest request,
            java.security.Principal principal) {
        org.springframework.security.authentication.UsernamePasswordAuthenticationToken token = 
                (org.springframework.security.authentication.UsernamePasswordAuthenticationToken) principal;
        User user = (User) token.getPrincipal();
        ChatMessageResponse response = chatService.sendMessage(projectId, request, user);
        messagingTemplate.convertAndSend("/topic/project/" + projectId, response);
    }

    @PatchMapping("/api/messages/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, @AuthenticationPrincipal User user) {
        chatService.markMessageAsRead(id, user);
        return ResponseEntity.ok().build();
    }
}
