package com.pfe.repository;

import com.pfe.entity.Application;
import com.pfe.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByStudentId(Long studentId);
    List<Application> findByTopicId(Long topicId);
    List<Application> findByTopicCreatedById(Long userId);
    List<Application> findByStatus(ApplicationStatus status);
    boolean existsByStudentIdAndTopicId(Long studentId, Long topicId);
    long countByStatus(ApplicationStatus status);
    
    // For trends
    long countByApplicationDateBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
    long countByTopicCreatedByIdAndStatus(Long userId, ApplicationStatus status);
}
