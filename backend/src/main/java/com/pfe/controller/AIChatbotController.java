package com.pfe.controller;

import com.pfe.dto.request.AIChatRequest;
import com.pfe.dto.response.AIChatResponse;
import com.pfe.service.AIChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AIChatbotController {

    private final AIChatbotService aiChatbotService;

    @PostMapping("/chat")
    public ResponseEntity<AIChatResponse> chat(@RequestBody AIChatRequest request) {
        return ResponseEntity.ok(aiChatbotService.getChatResponse(request.getMessage()));
    }
}
