package com.pfe.service;

import com.pfe.dto.request.ChatMessageRequest;
import com.pfe.dto.response.ChatMessageResponse;
import com.pfe.entity.ChatMessage;
import com.pfe.entity.Project;
import com.pfe.entity.User;
import com.pfe.enums.MessageType;
import com.pfe.enums.Role;
import com.pfe.enums.TopicType;
import com.pfe.exception.BadRequestException;
import com.pfe.exception.ResourceNotFoundException;
import com.pfe.repository.ChatMessageRepository;
import com.pfe.repository.ProjectRepository;
import com.pfe.util.ProjectAccessHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ProjectRepository projectRepository;
    private final ProjectAccessHelper projectAccessHelper;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getProjectMessages(Long projectId, User user, Pageable pageable) {
        projectAccessHelper.getProjectAndCheckAccess(projectId, user);
        return chatMessageRepository.findByProjectIdOrderBySentAtDesc(projectId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    public ChatMessageResponse sendMessage(Long projectId, ChatMessageRequest request, User sender) {
        Project project = projectAccessHelper.getProjectAndCheckAccess(projectId, sender);

        if (sender.getRole() == Role.ADMIN) {
            throw new BadRequestException("Admins cannot send messages in projects.");
        }
        if (sender.getRole() == Role.COMPANY && project.getTopic().getType() != TopicType.INTERNSHIP) {
            throw new BadRequestException("Companies can only send messages in internship projects.");
        }
        if (request.getType() != MessageType.TEXT) {
            throw new BadRequestException("Users can only send TEXT messages.");
        }
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new BadRequestException("Message content cannot be empty.");
        }

        ChatMessage message = ChatMessage.builder()
                .project(project)
                .sender(sender)
                .content(request.getContent())
                .type(MessageType.TEXT)
                .build();

        message = chatMessageRepository.save(message);
        
        // Notify participants who are not the sender
        notifyParticipants(project, sender.getId(), "Nouveau message de " + sender.getFirstName() + " : " + request.getContent());

        return mapToResponse(message);
    }

    @Transactional
    public void createSystemMessage(Long projectId, MessageType type, Long referenceId, String content) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        ChatMessage message = ChatMessage.builder()
                .project(project)
                .sender(null) // System messages have no specific sender
                .content(content)
                .type(type)
                .referenceId(referenceId)
                .build();

        message = chatMessageRepository.save(message);

        ChatMessageResponse response = mapToResponse(message);
        messagingTemplate.convertAndSend("/topic/project/" + projectId, response);
        
        if (type == MessageType.DOCUMENT_REF || type == MessageType.MILESTONE_REF) {
            if (project.getSupervisor() != null) {
                notificationService.createNotification(project.getSupervisor().getId(), content);
            }
            if (project.getCompany() != null && project.getCompany().getUser() != null) {
                notificationService.createNotification(project.getCompany().getUser().getId(), content);
            }
        } else if (type == MessageType.SYSTEM) {
            notifyParticipants(project, null, content);
        }
    }

    @Transactional
    public void markMessageAsRead(Long messageId, User user) {
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        projectAccessHelper.assertUserBelongsToProject(message.getProject(), user);

        message.getReadBy().add(user.getId());
        chatMessageRepository.save(message);
        
        ChatMessageResponse response = mapToResponse(message);
        // We broadcast an event so clients can update their read receipts real-time
        messagingTemplate.convertAndSend("/topic/project/" + message.getProject().getId() + "/read", response);
    }

    private void notifyParticipants(Project project, Long excludeUserId, String notificationContent) {
        if (project.getStudent() != null && !project.getStudent().getId().equals(excludeUserId)) {
            notificationService.createNotification(project.getStudent().getId(), notificationContent);
        }
        if (project.getSupervisor() != null && !project.getSupervisor().getId().equals(excludeUserId)) {
            notificationService.createNotification(project.getSupervisor().getId(), notificationContent);
        }
        if (project.getCompany() != null && project.getCompany().getUser() != null && !project.getCompany().getUser().getId().equals(excludeUserId)) {
            notificationService.createNotification(project.getCompany().getUser().getId(), notificationContent);
        }
    }

    private ChatMessageResponse mapToResponse(ChatMessage message) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .projectId(message.getProject().getId())
                .senderId(message.getSender() != null ? message.getSender().getId() : null)
                .senderName(message.getSender() != null ? message.getSender().getFirstName() + " " + message.getSender().getLastName() : "System")
                .senderRole(message.getSender() != null ? message.getSender().getRole() : null)
                .content(message.getContent())
                .type(message.getType())
                .referenceId(message.getReferenceId())
                .sentAt(message.getSentAt())
                .readBy(message.getReadBy())
                .build();
    }
}
