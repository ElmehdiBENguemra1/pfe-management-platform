package com.pfe.repository;

import com.pfe.entity.Topic;
import com.pfe.enums.TopicStatus;
import com.pfe.enums.TopicType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TopicRepository extends JpaRepository<Topic, Long> {
    List<Topic> findByStatus(TopicStatus status);
    List<Topic> findByCreatedBy_Id(Long userId);
    List<Topic> findByStatusOrCreatedBy_Id(TopicStatus status, Long userId);
    List<Topic> findByType(TopicType type);
    
    long countByStatus(TopicStatus status);
    List<Topic> findByStatusAndCreatedAtBefore(TopicStatus status, LocalDateTime dateTime);
    
    @org.springframework.data.jpa.repository.Query("SELECT t FROM Topic t WHERE t.status = 'APPROVED' AND (" +
           "LOWER(t.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.requiredSkills) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Topic> searchTopics(String query);
    
    long countByCreatedBy_IdAndStatus(Long userId, TopicStatus status);
}
