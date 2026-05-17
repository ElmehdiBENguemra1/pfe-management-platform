package com.pfe.service;

import com.pfe.dto.request.TopicRequest;
import com.pfe.dto.response.TopicResponse;
import com.pfe.entity.Topic;
import com.pfe.entity.User;
import com.pfe.exception.BadRequestException;
import com.pfe.exception.ResourceNotFoundException;
import com.pfe.enums.TopicStatus;
import com.pfe.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class TopicService {

    private final TopicRepository topicRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<TopicResponse> getAllTopics() {
        return topicRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TopicResponse> searchTopics(String query) {
        return topicRepository.searchTopics(query).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TopicResponse> getApprovedTopics() {
        return topicRepository.findByStatus(TopicStatus.APPROVED).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TopicResponse> getPendingTopics() {
        return topicRepository.findByStatus(TopicStatus.PENDING).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TopicResponse> getMyTopics(Long userId) {
        System.out.println("Fetching topics for creator ID: " + userId);
        List<Topic> topics = topicRepository.findByCreatedBy_Id(userId);
        System.out.println("Found " + topics.size() + " topics");
        return topics.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TopicResponse> getVisibleTopics(Long userId) {
        System.out.println("Fetching visible topics for user ID: " + userId);
        List<Topic> topics = topicRepository.findByStatusOrCreatedBy_Id(TopicStatus.APPROVED, userId);
        System.out.println("Found " + topics.size() + " visible topics");
        return topics.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TopicResponse getTopicById(Long id) {
        Topic topic = topicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found with id: " + id));
        return mapToResponse(topic);
    }

    @Transactional
    public TopicResponse createTopic(TopicRequest request, User user) {
        if (user == null) {
            throw new BadRequestException("User not authenticated");
        }

        Topic topic = Topic.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .requiredSkills(request.getRequiredSkills())
                .type(request.getType())
                .duration(request.getDuration())
                .domain(request.getDomain())
                .places(request.getPlaces())
                .requiredLevel(request.getRequiredLevel())
                .descriptionPdfUrl(request.getDescriptionPdfUrl())
                .salary(request.getSalary())
                .workAddress(request.getWorkAddress())
                .contactPerson(request.getContactPerson())
                .applicationDeadline(request.getApplicationDeadline() != null ? LocalDateTime.parse(request.getApplicationDeadline() + "T00:00:00") : null)
                .createdBy(user)
                .status(TopicStatus.PENDING)
                .build();

        topic = topicRepository.save(topic);
        return mapToResponse(topic);
    }

    @Transactional
    public TopicResponse updateTopic(Long id, TopicRequest request, User user) {
        Topic topic = topicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found with id: " + id));

        if (!topic.getCreatedBy().getId().equals(user.getId())) {
            throw new BadRequestException("You can only update your own topics");
        }

        if (request.getTitle() != null) topic.setTitle(request.getTitle());
        if (request.getDescription() != null) topic.setDescription(request.getDescription());
        if (request.getRequiredSkills() != null) topic.setRequiredSkills(request.getRequiredSkills());
        if (request.getType() != null) topic.setType(request.getType());
        if (request.getDuration() != null) topic.setDuration(request.getDuration());
        if (request.getDomain() != null) topic.setDomain(request.getDomain());
        if (request.getPlaces() > 0) topic.setPlaces(request.getPlaces());
        if (request.getRequiredLevel() != null) topic.setRequiredLevel(request.getRequiredLevel());
        if (request.getDescriptionPdfUrl() != null) topic.setDescriptionPdfUrl(request.getDescriptionPdfUrl());
        if (request.getSalary() != null) topic.setSalary(request.getSalary());
        if (request.getWorkAddress() != null) topic.setWorkAddress(request.getWorkAddress());
        if (request.getContactPerson() != null) topic.setContactPerson(request.getContactPerson());
        if (request.getApplicationDeadline() != null) topic.setApplicationDeadline(LocalDateTime.parse(request.getApplicationDeadline() + "T00:00:00"));

        topic = topicRepository.save(topic);
        return mapToResponse(topic);
    }

    @Transactional
    public TopicResponse approveTopic(Long id, boolean approved, String comment) {
        Topic topic = topicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found with id: " + id));

        topic.setStatus(approved ? TopicStatus.APPROVED : TopicStatus.REJECTED);
        if (comment != null) topic.setRejectionComment(comment);
        topic = topicRepository.save(topic);

        // Notify the topic creator
        String status = approved ? "approved" : "rejected";
        notificationService.createNotification(
                topic.getCreatedBy().getId(),
                "Your topic \"" + topic.getTitle() + "\" has been " + status + (comment != null ? ": " + comment : ".")
        );

        return mapToResponse(topic);
    }

    @Transactional
    public void deleteTopic(Long id, User user) {
        Topic topic = topicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found with id: " + id));

        if (!topic.getCreatedBy().getId().equals(user.getId()) &&
                !user.getRole().name().equals("ADMIN")) {
            throw new BadRequestException("You can only delete your own topics");
        }

        topicRepository.delete(topic);
    }

    @Transactional
    public TopicResponse duplicateTopic(Long id, User user) {
        Topic original = topicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found"));
        
        Topic duplicate = Topic.builder()
                .title(original.getTitle() + " (Copy)")
                .description(original.getDescription())
                .requiredSkills(original.getRequiredSkills())
                .type(original.getType())
                .duration(original.getDuration())
                .domain(original.getDomain())
                .places(original.getPlaces())
                .requiredLevel(original.getRequiredLevel())
                .salary(original.getSalary())
                .workAddress(original.getWorkAddress())
                .contactPerson(original.getContactPerson())
                .applicationDeadline(original.getApplicationDeadline())
                .createdBy(user)
                .status(TopicStatus.PENDING)
                .build();
        
        return mapToResponse(topicRepository.save(duplicate));
    }

    @Transactional
    public void inviteStudent(Long topicId, Long studentId, User user) {
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found"));

        if (!topic.getCreatedBy().getId().equals(user.getId()) &&
                !user.getRole().name().equals("ADMIN")) {
            throw new BadRequestException("You can only invite students to your own topics");
        }

        String senderName = topic.getCreatedBy().getFirstName() + " " + topic.getCreatedBy().getLastName();
        if (topic.getCreatedBy().getRole() == com.pfe.enums.Role.COMPANY && topic.getCreatedBy().getCompany() != null) {
            senderName = topic.getCreatedBy().getCompany().getCompanyName();
        }

        String content = "L'entreprise " + senderName + " vous invite à postuler pour le sujet : \"" + topic.getTitle() + "\".";
        if (topic.getCreatedBy().getRole() != com.pfe.enums.Role.COMPANY) {
            content = "L'encadrant " + senderName + " vous invite à postuler pour le sujet : \"" + topic.getTitle() + "\".";
        }

        notificationService.createNotification(studentId, content);
    }

    public TopicResponse mapToResponse(Topic topic) {
        return TopicResponse.builder()
                .id(topic.getId())
                .title(topic.getTitle())
                .description(topic.getDescription())
                .requiredSkills(topic.getRequiredSkills())
                .type(topic.getType())
                .duration(topic.getDuration())
                .domain(topic.getDomain())
                .places(topic.getPlaces())
                .requiredLevel(topic.getRequiredLevel())
                .descriptionPdfUrl(topic.getDescriptionPdfUrl())
                .approved(topic.isApproved())
                .status(topic.getStatus())
                .rejectionComment(topic.getRejectionComment())
                .createdById(topic.getCreatedBy() != null ? topic.getCreatedBy().getId() : null)
                .createdByName(topic.getCreatedBy() != null ? 
                    (topic.getCreatedBy().getRole() == com.pfe.enums.Role.COMPANY && topic.getCreatedBy().getCompany() != null ? 
                        topic.getCreatedBy().getCompany().getCompanyName() : 
                        topic.getCreatedBy().getFirstName() + " " + topic.getCreatedBy().getLastName()) : "Unknown")
                .createdAt(topic.getCreatedAt())
                .applicationCount(topic.getApplications() != null ? topic.getApplications().size() : 0)
                .salary(topic.getSalary())
                .workAddress(topic.getWorkAddress())
                .contactPerson(topic.getContactPerson())
                .applicationDeadline(topic.getApplicationDeadline())
                .build();
    }
}
