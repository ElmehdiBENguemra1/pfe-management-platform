package com.pfe.controller;

import com.pfe.entity.User;
import com.pfe.dto.request.MilestoneRequest;
import com.pfe.dto.response.MilestoneResponse;
import com.pfe.service.MilestoneService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MilestoneController {

    private final MilestoneService milestoneService;

    @GetMapping("/projects/{projectId}/milestones")
    public ResponseEntity<List<MilestoneResponse>> getProjectMilestones(@PathVariable Long projectId,
                                                                       @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(milestoneService.getProjectMilestones(projectId, user));
    }

    @PostMapping("/projects/{projectId}/milestones")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'COMPANY')")
    public ResponseEntity<MilestoneResponse> createMilestone(@PathVariable Long projectId,
                                                                @RequestBody MilestoneRequest request,
                                                                @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(milestoneService.createMilestone(projectId, request, user));
    }

    @PutMapping("/milestones/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'COMPANY')")
    public ResponseEntity<MilestoneResponse> updateMilestone(@PathVariable Long id,
                                                                @RequestBody MilestoneRequest request,
                                                                @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(milestoneService.updateMilestone(id, request, user));
    }

    @PatchMapping("/milestones/{id}/complete")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> completeMilestone(@PathVariable Long id,
                                                   @AuthenticationPrincipal User user) {
        milestoneService.completeMilestone(id, user);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/milestones/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'COMPANY')")
    public ResponseEntity<Void> deleteMilestone(@PathVariable Long id,
                                                @AuthenticationPrincipal User user) {
        milestoneService.deleteMilestone(id, user);
        return ResponseEntity.noContent().build();
    }
}
