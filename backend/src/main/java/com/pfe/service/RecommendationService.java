package com.pfe.service;

import com.pfe.entity.Topic;
import com.pfe.entity.User;
import com.pfe.enums.TopicStatus;
import com.pfe.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final TopicRepository topicRepository;

    public List<Topic> getRecommendations(User student) {
        if (student.getStudentProfile() == null || student.getStudentProfile().getSkills() == null) {
            // Default to latest approved topics if no skills specified
            return topicRepository.findByStatus(TopicStatus.APPROVED).stream()
                    .sorted(Comparator.comparing(Topic::getCreatedAt).reversed())
                    .limit(3)
                    .collect(Collectors.toList());
        }

        String[] skills = student.getStudentProfile().getSkills().toLowerCase().split(",");
        List<Topic> approvedTopics = topicRepository.findByStatus(TopicStatus.APPROVED);

        return approvedTopics.stream()
                .map(topic -> new ScoredTopic(topic, calculateScore(topic, skills)))
                .filter(st -> st.score > 0)
                .sorted(Comparator.comparing(ScoredTopic::getScore).reversed())
                .limit(3)
                .map(st -> st.topic)
                .collect(Collectors.toList());
    }

    private int calculateScore(Topic topic, String[] skills) {
        int score = 0;
        String content = (topic.getTitle() + " " + topic.getDescription() + " " + topic.getRequiredSkills()).toLowerCase();
        
        for (String skill : skills) {
            String trimmedSkill = skill.trim();
            if (trimmedSkill.isEmpty()) continue;
            if (content.contains(trimmedSkill)) {
                score += 10;
                // Bonus if the skill is in the title
                if (topic.getTitle().toLowerCase().contains(trimmedSkill)) {
                    score += 5;
                }
            }
        }
        return score;
    }

    @RequiredArgsConstructor
    private static class ScoredTopic {
        private final Topic topic;
        private final int score;

        public int getScore() { return score; }
    }
}
