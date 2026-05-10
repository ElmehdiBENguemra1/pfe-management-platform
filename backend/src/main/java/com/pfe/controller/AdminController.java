package com.pfe.controller;

import com.pfe.entity.AuditLog;
import com.pfe.entity.User;
import com.pfe.enums.ApplicationStatus;
import com.pfe.enums.UserStatus;
import com.pfe.service.AdminService;
import com.pfe.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@SuppressWarnings("unchecked")
public class AdminController {

    private final AdminService adminService;
    private final AuditLogService auditLogService;

    @PutMapping("/users/status")
    public ResponseEntity<Void> updateUsersStatus(@RequestBody Map<String, Object> request,
                                                   @AuthenticationPrincipal User admin) {
        Object idsObj = request.get("ids");
        Object statusObj = request.get("status");
        
        if (!(idsObj instanceof List) || statusObj == null) {
            return ResponseEntity.badRequest().build();
        }
        
        List<Number> rawIds = (List<Number>) idsObj;
        List<Long> ids = rawIds.stream().map(Number::longValue).toList();
        UserStatus status = UserStatus.valueOf((String) statusObj);
        adminService.updateUserStatus(ids, status, admin);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/topics/archive")
    public ResponseEntity<Void> archiveTopics(@RequestBody List<Long> ids,
                                               @AuthenticationPrincipal User admin) {
        adminService.archiveTopics(ids, admin);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/applications/{id}/override")
    public ResponseEntity<Void> overrideApplication(@PathVariable Long id,
                                                     @RequestBody Map<String, String> request,
                                                     @AuthenticationPrincipal User admin) {
        ApplicationStatus status = ApplicationStatus.valueOf(request.get("status"));
        String comment = request.get("comment");
        adminService.overrideApplication(id, status, comment, admin);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/users/{id}/impersonate")
    public ResponseEntity<Map<String, String>> impersonate(@PathVariable Long id,
                                                            @AuthenticationPrincipal User admin) {
        String token = adminService.impersonateUser(id, admin);
        return ResponseEntity.ok(Map.of("token", token));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs(@RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(auditLogService.getRecentLogs(limit));
    }
}
