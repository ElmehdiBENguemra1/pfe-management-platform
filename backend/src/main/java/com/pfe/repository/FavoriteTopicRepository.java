package com.pfe.repository;

import com.pfe.entity.FavoriteTopic;
import com.pfe.entity.Topic;
import com.pfe.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteTopicRepository extends JpaRepository<FavoriteTopic, Long> {
    List<FavoriteTopic> findByUser_Id(Long userId);
    Optional<FavoriteTopic> findByUserAndTopic(User user, Topic topic);
    void deleteByUserAndTopic(User user, Topic topic);
    boolean existsByUserAndTopic(User user, Topic topic);
}
