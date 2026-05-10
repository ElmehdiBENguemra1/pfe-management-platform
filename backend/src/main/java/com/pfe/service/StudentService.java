package com.pfe.service;

import com.pfe.entity.FavoriteTopic;
import com.pfe.entity.Topic;
import com.pfe.entity.User;
import com.pfe.exception.ResourceNotFoundException;
import com.pfe.repository.FavoriteTopicRepository;
import com.pfe.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class StudentService {

    private final FavoriteTopicRepository favoriteTopicRepository;
    private final TopicRepository topicRepository;

    @Transactional
    public void toggleFavorite(Long topicId, User user) {
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found"));

        if (favoriteTopicRepository.existsByUserAndTopic(user, topic)) {
            favoriteTopicRepository.deleteByUserAndTopic(user, topic);
        } else {
            FavoriteTopic fav = FavoriteTopic.builder()
                    .user(user)
                    .topic(topic)
                    .build();
            favoriteTopicRepository.save(fav);
        }
    }

    public List<Topic> getFavorites(User user) {
        return favoriteTopicRepository.findByUser_Id(user.getId()).stream()
                .map(FavoriteTopic::getTopic)
                .collect(Collectors.toList());
    }
}
