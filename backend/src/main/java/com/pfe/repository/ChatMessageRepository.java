package com.pfe.repository;

import com.pfe.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByProject_IdOrderBySentAtAsc(Long projectId);
    org.springframework.data.domain.Page<ChatMessage> findByProjectIdOrderBySentAtDesc(Long projectId, org.springframework.data.domain.Pageable pageable);
}
