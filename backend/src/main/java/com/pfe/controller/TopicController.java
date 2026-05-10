package com.pfe.controller;

import com.pfe.dto.request.TopicRequest;
import com.pfe.dto.response.TopicResponse;
import com.pfe.entity.User;
import com.pfe.service.TopicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/topics")
@RequiredArgsConstructor
public class TopicController {

    private final TopicService topicService;

    @GetMapping("/search")
    public ResponseEntity<List<TopicResponse>> searchTopics(@RequestParam String query) {
        return ResponseEntity.ok(topicService.searchTopics(query));
    }

    @GetMapping
    public ResponseEntity<List<TopicResponse>> getAllTopics(@AuthenticationPrincipal User user) {
        System.out.println("GET /api/topics called by user: " + (user != null ? user.getEmail() : "anonymous"));
        
        if (user == null) {
            return ResponseEntity.ok(topicService.getVisibleTopics(null));
        }

        if (user.getRole().name().equals("ADMIN")) {
            return ResponseEntity.ok(topicService.getAllTopics());
        }
        return ResponseEntity.ok(topicService.getVisibleTopics(user.getId()));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TopicResponse>> getAllTopicsAdmin() {
        return ResponseEntity.ok(topicService.getAllTopics());
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TopicResponse>> getPendingTopics() {
        return ResponseEntity.ok(topicService.getPendingTopics());
    }

    @GetMapping("/my")
    public ResponseEntity<List<TopicResponse>> getMyTopics(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(topicService.getMyTopics(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TopicResponse> getTopicById(@PathVariable Long id) {
        return ResponseEntity.ok(topicService.getTopicById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'COMPANY', 'ADMIN')")
    public ResponseEntity<TopicResponse> createTopic(@jakarta.validation.Valid @RequestBody TopicRequest request,
                                                      @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(topicService.createTopic(request, user));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'COMPANY', 'ADMIN')")
    public ResponseEntity<TopicResponse> updateTopic(@PathVariable Long id,
                                                      @jakarta.validation.Valid @RequestBody TopicRequest request,
                                                      @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(topicService.updateTopic(id, request, user));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TopicResponse> approveTopic(@PathVariable Long id,
                                                       @RequestParam boolean approved,
                                                       @RequestParam(required = false) String comment) {
        return ResponseEntity.ok(topicService.approveTopic(id, approved, comment));
    }

    @PostMapping("/{id}/duplicate")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'COMPANY', 'ADMIN')")
    public ResponseEntity<TopicResponse> duplicateTopic(@PathVariable Long id,
                                                         @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(topicService.duplicateTopic(id, user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'COMPANY')")
    public ResponseEntity<Void> deleteTopic(@PathVariable Long id,
                                             @AuthenticationPrincipal User user) {
        topicService.deleteTopic(id, user);
        return ResponseEntity.noContent().build();
    }
}
