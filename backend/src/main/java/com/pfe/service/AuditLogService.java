package com.pfe.service;

import com.pfe.entity.AuditLog;
import com.pfe.entity.User;
import com.pfe.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void log(String action, String details, User user, String entityType, Long entityId) {
        AuditLog log = AuditLog.builder()
                .action(action)
                .details(details)
                .user(user)
                .entityType(entityType)
                .entityId(entityId)
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(log);
    }

    public List<AuditLog> getRecentLogs(int limit) {
        // This would ideally be a paginated query or a custom query to limit results
        return auditLogRepository.findAllByOrderByTimestampDesc().stream().limit(limit).toList();
    }
}
