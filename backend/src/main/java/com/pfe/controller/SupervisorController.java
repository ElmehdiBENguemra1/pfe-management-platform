package com.pfe.controller;

import com.pfe.entity.User;
import com.pfe.enums.DocumentStatus;
import com.pfe.service.SupervisorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import com.pfe.service.DocumentService;

@RestController
@RequestMapping("/api/supervisor")
@PreAuthorize("hasAnyRole('SUPERVISOR', 'ADMIN')")
@RequiredArgsConstructor
public class SupervisorController {

    private final SupervisorService supervisorService;
    private final DocumentService documentService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(supervisorService.getDashboardStats(user));
    }

    @PutMapping("/applications/{id}/internal-notes")
    public ResponseEntity<Void> updateInternalNotes(@PathVariable Long id, @RequestBody Map<String, String> request, @AuthenticationPrincipal User user) {
        supervisorService.updateInternalNotes(id, request.get("notes"), user);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/documents/{id}/review")
    public ResponseEntity<Void> reviewDocument(@PathVariable Long id, @RequestBody Map<String, String> request, @AuthenticationPrincipal User user) {
        DocumentStatus status = DocumentStatus.valueOf(request.get("status"));
        documentService.validateDocument(id, status, request.get("comment"), user);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/projects/{id}/grade")
    public ResponseEntity<Void> gradeProject(@PathVariable Long id, @RequestBody Map<String, Object> grades, @AuthenticationPrincipal User user) {
        supervisorService.gradeProject(id, grades, user);
        return ResponseEntity.ok().build();
    }
}
