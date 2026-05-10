package com.pfe.controller;

import com.pfe.dto.request.LoginRequest;
import com.pfe.dto.request.RegisterRequest;
import com.pfe.dto.response.AuthResponse;
import com.pfe.dto.response.UserResponse;
import com.pfe.entity.User;
import com.pfe.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(authService.getCurrentUser(user));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal User user,
            @RequestBody com.pfe.dto.request.ProfileUpdateRequest request) {
        return ResponseEntity.ok(authService.updateProfile(user, request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> requestPasswordReset(@RequestBody java.util.Map<String, String> request) {
        authService.requestPasswordReset(request.get("identifier"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@RequestBody java.util.Map<String, String> request) {
        authService.resetPassword(request.get("token"), request.get("newPassword"));
        return ResponseEntity.ok().build();
    }
}
