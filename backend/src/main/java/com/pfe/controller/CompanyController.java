package com.pfe.controller;

import com.pfe.entity.User;
import com.pfe.service.CompanyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/company")
@PreAuthorize("hasAnyRole('COMPANY', 'ADMIN')")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(companyService.getDashboardStats(user));
    }

    @GetMapping("/suggestions")
    public ResponseEntity<List<com.pfe.dto.response.UserResponse>> getSuggestedStudents(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(companyService.getSuggestedStudents(user));
    }

    @PutMapping("/profile")
    public ResponseEntity<Void> updateProfile(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> profileData) {
        companyService.updateCompanyProfile(user, profileData);
        return ResponseEntity.ok().build();
    }
}
