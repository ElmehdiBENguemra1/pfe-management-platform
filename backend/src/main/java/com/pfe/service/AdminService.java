package com.pfe.service;

import com.pfe.config.JwtService;
import com.pfe.entity.*;
import com.pfe.enums.ApplicationStatus;
import com.pfe.enums.TopicStatus;
import com.pfe.enums.UserStatus;
import com.pfe.exception.BadRequestException;
import com.pfe.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class AdminService {

    private final UserRepository userRepository;
    private final TopicRepository topicRepository;
    private final ApplicationRepository applicationRepository;
    private final JwtService jwtService;
    private final AuditLogService auditLogService;

    @Transactional
    public void updateUserStatus(List<Long> userIds, UserStatus status, User admin) {
        List<User> users = userRepository.findAllById(userIds);
        users.forEach(u -> {
            u.setStatus(status);
            auditLogService.log("USER_STATUS_UPDATED", "Status changed to " + status + " by admin", admin, "USER", u.getId());
        });
        userRepository.saveAll(users);
    }

    @Transactional
    public void archiveTopics(List<Long> topicIds, User admin) {
        List<Topic> topics = topicRepository.findAllById(topicIds);
        topics.forEach(t -> {
            t.setStatus(TopicStatus.ARCHIVED);
            auditLogService.log("TOPIC_ARCHIVED", "Topic archived by admin", admin, "TOPIC", t.getId());
        });
        topicRepository.saveAll(topics);
    }

    @Transactional
    public void overrideApplication(Long applicationId, ApplicationStatus status, String comment, User admin) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new BadRequestException("Application not found"));
        
        app.setStatus(status);
        app.setReviewComment(comment);
        app.setReviewedBy(admin);
        app.setReviewedAt(LocalDateTime.now());
        
        auditLogService.log("APPLICATION_OVERRIDE", "Admin override to " + status + ": " + comment, admin, "APPLICATION", app.getId());
        applicationRepository.save(app);
    }

    public String impersonateUser(Long userId, User admin) {
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));
        
        Map<String, Object> claims = new HashMap<>();
        claims.put("impersonator", admin.getEmail());
        claims.put("impersonatorId", admin.getId());
        
        auditLogService.log("USER_IMPERSONATION", "Admin started impersonating " + targetUser.getEmail(), admin, "USER", targetUser.getId());
        
        return jwtService.generateToken(claims, targetUser);
    }
}
