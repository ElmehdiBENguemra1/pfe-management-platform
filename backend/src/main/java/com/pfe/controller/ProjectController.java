package com.pfe.controller;

import com.pfe.dto.request.ProjectUpdateRequest;
import com.pfe.dto.response.ProjectResponse;
import com.pfe.entity.User;
import com.pfe.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getProjects(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(projectService.getProjectsForUser(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProjectById(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<ProjectResponse> updateProject(@PathVariable Long id,
                                                           @RequestBody ProjectUpdateRequest request,
                                                           @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(projectService.updateProject(id, request, user));
    }

    @PostMapping("/{id}/agreement/sign")
    public ResponseEntity<Void> signAgreement(@PathVariable Long id, @AuthenticationPrincipal User user) {
        projectService.signAgreement(id, user);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/evaluation/company")
    @PreAuthorize("hasRole('COMPANY')")
    public ResponseEntity<Void> saveCompanyEvaluation(@PathVariable Long id, 
                                                     @RequestBody Map<String, Object> evaluation,
                                                     @AuthenticationPrincipal User user) {
        projectService.saveCompanyEvaluation(id, evaluation, user);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/grade")
    @PreAuthorize("hasAnyRole('SUPERVISOR', 'ADMIN')")
    public ResponseEntity<Void> gradeProject(@PathVariable Long id,
                                              @RequestBody Map<String, Object> grades,
                                              @AuthenticationPrincipal User user) {
        projectService.gradeProject(id, grades, user);
        return ResponseEntity.ok().build();
    }
}
