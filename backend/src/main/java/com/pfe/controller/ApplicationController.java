package com.pfe.controller;

import com.pfe.dto.request.ApplicationRequest;
import com.pfe.dto.response.ApplicationResponse;
import com.pfe.entity.User;
import com.pfe.enums.ApplicationStatus;
import com.pfe.service.ApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    @GetMapping
    public ResponseEntity<List<ApplicationResponse>> getApplications(@AuthenticationPrincipal User user) {
        return switch (user.getRole()) {
            case STUDENT -> ResponseEntity.ok(applicationService.getStudentApplications(user.getId()));
            case SUPERVISOR -> ResponseEntity.ok(applicationService.getApplicationsForSupervisor(user.getId()));
            case COMPANY -> ResponseEntity.ok(applicationService.getApplicationsForSupervisor(user.getId()));
            default -> ResponseEntity.ok(applicationService.getAllApplications());
        };
    }

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApplicationResponse> createApplication(@RequestBody ApplicationRequest request,
                                                                   @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(applicationService.createApplication(request, user));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'COMPANY')")
    public ResponseEntity<ApplicationResponse> updateStatus(@PathVariable Long id,
                                                              @RequestParam ApplicationStatus status,
                                                              @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(applicationService.updateApplicationStatus(id, status, user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> cancelApplication(@PathVariable Long id,
                                                    @AuthenticationPrincipal User user) {
        applicationService.cancelApplication(id, user);
        return ResponseEntity.noContent().build();
    }
}
