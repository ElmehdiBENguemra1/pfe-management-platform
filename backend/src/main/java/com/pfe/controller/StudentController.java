package com.pfe.controller;

import com.pfe.dto.response.TopicResponse;
import com.pfe.entity.Topic;
import com.pfe.entity.User;
import com.pfe.service.RecommendationService;
import com.pfe.service.StudentService;
import com.pfe.service.TopicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;
    private final RecommendationService recommendationService;
    private final TopicService topicService;

    @GetMapping("/recommendations")
    public ResponseEntity<List<TopicResponse>> getRecommendations(@AuthenticationPrincipal User user) {
        List<Topic> topics = recommendationService.getRecommendations(user);
        return ResponseEntity.ok(topics.stream().map(topicService::mapToResponse).collect(Collectors.toList()));
    }

    @PostMapping("/topics/{id}/favorite")
    public ResponseEntity<Void> toggleFavorite(@PathVariable Long id, @AuthenticationPrincipal User user) {
        studentService.toggleFavorite(id, user);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/topics/favorites")
    public ResponseEntity<List<TopicResponse>> getFavorites(@AuthenticationPrincipal User user) {
        List<Topic> topics = studentService.getFavorites(user);
        return ResponseEntity.ok(topics.stream().map(topicService::mapToResponse).collect(Collectors.toList()));
    }
}
