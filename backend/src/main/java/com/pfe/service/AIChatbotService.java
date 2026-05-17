package com.pfe.service;

import com.pfe.dto.response.AIChatResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class AIChatbotService {

    @Value("${app.ai.gemini.key:}")
    private String geminiApiKey;

    private final RestTemplate restTemplate;
    private final com.pfe.repository.TopicRepository topicRepository;

    // Models to try in order — gemini-2.5-flash has separate quota and works!
    private static final String[] GEMINI_MODELS = {
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-2.5-pro"
    };

    private static final String GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";

    @jakarta.annotation.PostConstruct
    public void init() {
        log.info("==================================================");
        log.info("AIChatbotService initialized");
        log.info("Gemini key: {}", geminiApiKey != null && !geminiApiKey.isEmpty() ? "PRESENT (" + geminiApiKey.substring(0, 8) + "...)" : "MISSING");
        log.info("==================================================");
    }

    public AIChatResponse getChatResponse(String message, com.pfe.entity.User user) {
        String systemContext = buildSystemContext(user);
        
        // 1. Try Gemini with multiple models
        if (geminiApiKey != null && !geminiApiKey.isEmpty()) {
            for (String model : GEMINI_MODELS) {
                try {
                    AIChatResponse resp = callGemini(systemContext, message, model);
                    if (resp != null) return resp;
                } catch (Exception e) {
                    log.warn("Gemini model '{}' failed: {}", model, e.getMessage());
                }
            }
        }

        // 2. Try Pollinations AI (free, no key needed)
        try {
            AIChatResponse resp = callPollinations(systemContext, message);
            if (resp != null) return resp;
        } catch (Exception e) {
            log.warn("Pollinations failed: {}", e.getMessage());
        }

        // 3. Last resort: simple local response
        return AIChatResponse.builder()
                .response(getLocalResponse(message))
                .modelUsed("Assistant Local")
                .build();
    }

    private String buildSystemContext(com.pfe.entity.User user) {
        StringBuilder sb = new StringBuilder();
        sb.append("Tu es un assistant IA pour la plateforme de gestion de PFE 'SmartPFE'.\n");
        sb.append("Utilisateur actuel: ").append(user.getFirstName()).append(" ").append(user.getLastName());
        sb.append(" (Rôle: ").append(user.getRole()).append(").\n");
        
        if (user.getStudentProfile() != null) {
            sb.append("Compétences de l'étudiant: ").append(user.getStudentProfile().getSkills()).append("\n");
            sb.append("Bio/Intérêts: ").append(user.getStudentProfile().getBio()).append("\n");
        }

        List<com.pfe.entity.Topic> topics = topicRepository.findByStatus(com.pfe.enums.TopicStatus.APPROVED);
        if (!topics.isEmpty()) {
            sb.append("\nVoici les sujets de PFE disponibles actuellement:\n");
            for (com.pfe.entity.Topic t : topics) {
                sb.append("- [ID: ").append(t.getId()).append("] ").append(t.getTitle());
                sb.append(" (Domaine: ").append(t.getDomain()).append(") ");
                sb.append("- Compétences requises: ").append(t.getRequiredSkills()).append("\n");
            }
            sb.append("\nSi l'étudiant demande une recommandation, analyse ses compétences et suggère les meilleurs sujets parmi la liste ci-dessus.");
        } else {
            sb.append("\nAucun sujet n'est disponible pour le moment.");
        }

        sb.append("\nRéponds toujours en français de manière professionnelle et concise.");
        return sb.toString();
    }

    private AIChatResponse callGemini(String systemContext, String message, String model) {
        log.info("Trying Gemini model: {}", model);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Merge system context and message for Gemini
        String combinedPrompt = systemContext + "\n\nQuestion de l'utilisateur: " + message;

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> contents = new HashMap<>();
        Map<String, Object> parts = new HashMap<>();
        parts.put("text", combinedPrompt);
        contents.put("parts", Collections.singletonList(parts));
        requestBody.put("contents", Collections.singletonList(contents));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        String url = GEMINI_BASE + model + ":generateContent?key=" + geminiApiKey;

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
        );
        Map<String, Object> body = response.getBody();

        if (response.getStatusCode() == HttpStatus.OK && body != null) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                Map<String, Object> firstCandidate = candidates.get(0);
                @SuppressWarnings("unchecked")
                Map<String, Object> content = (Map<String, Object>) firstCandidate.get("content");
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> partsList = (List<Map<String, Object>>) content.get("parts");
                Map<String, Object> firstPart = partsList.get(0);
                String text = (String) firstPart.get("text");
                log.info("Gemini model '{}' responded successfully", model);
                return AIChatResponse.builder()
                        .response(text)
                        .modelUsed("Google " + model)
                        .build();
            }
        }
        throw new RuntimeException("Gemini model '" + model + "' returned no valid response");
    }

    private AIChatResponse callPollinations(String systemContext, String message) {
        try {
            log.info("Trying Pollinations AI fallback...");
            String url = "https://text.pollinations.ai/openai";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "openai");
            
            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> sysMsg = new HashMap<>();
            sysMsg.put("role", "system");
            sysMsg.put("content", systemContext);
            messages.add(sysMsg);
            
            Map<String, String> userMsg = new HashMap<>();
            userMsg.put("role", "user");
            userMsg.put("content", message);
            messages.add(userMsg);
            
            requestBody.put("messages", messages);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
            );

            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("choices")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) body.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> msgObj = (Map<String, Object>) choices.get(0).get("message");
                    String text = (String) msgObj.get("content");
                    log.info("Pollinations AI responded successfully");
                    return AIChatResponse.builder()
                            .response(text)
                            .modelUsed("Pollinations AI")
                            .build();
                }
            }

            // Secondary fallback: simple text endpoint
            String encodedMessage = java.net.URLEncoder.encode(message, java.nio.charset.StandardCharsets.UTF_8.toString());
            String simpleUrl = "https://text.pollinations.ai/" + encodedMessage;
            String simpleResponse = restTemplate.getForObject(simpleUrl, String.class);
            if (simpleResponse != null && !simpleResponse.isEmpty()) {
                return AIChatResponse.builder()
                        .response(simpleResponse)
                        .modelUsed("Pollinations AI (Text)")
                        .build();
            }
        } catch (Exception e) {
            log.error("Pollinations AI failed: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Fallback local quand toutes les APIs externes échouent.
     */
    private String getLocalResponse(String message) {
        String lower = message.toLowerCase();
        
        if (lower.contains("bonjour") || lower.contains("salut") || lower.contains("hello") || lower.contains("hi")) {
            return "Bonjour ! 👋 Je suis l'assistant SmartPFE. Comment puis-je vous aider aujourd'hui ?";
        }
        if (lower.contains("date") || lower.contains("aujourd")) {
            return "Nous sommes le " + java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")) + ". Comment puis-je vous aider ?";
        }
        if (lower.contains("heure") || lower.contains("time")) {
            return "Il est actuellement " + java.time.LocalTime.now().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")) + ". Que puis-je faire pour vous ?";
        }
        if (lower.contains("pfe") || lower.contains("projet") || lower.contains("stage")) {
            return "Pour gérer votre PFE, vous pouvez :\n• Consulter les sujets disponibles dans l'onglet 'Sujets'\n• Suivre vos candidatures dans 'Candidatures'\n• Accéder à votre espace projet pour les jalons et le suivi\n\nPour une aide plus détaillée, veuillez réessayer dans quelques instants — les services IA sont temporairement indisponibles.";
        }
        if (lower.contains("merci") || lower.contains("thank")) {
            return "De rien ! N'hésitez pas si vous avez d'autres questions. 😊";
        }
        if (lower.contains("aide") || lower.contains("help")) {
            return "Je peux vous aider avec :\n• La navigation sur la plateforme\n• Des informations sur votre PFE\n• La gestion de votre profil\n• Des questions générales\n\nNote : Les services IA avancés sont temporairement indisponibles. Réessayez dans quelques minutes pour des réponses plus complètes.";
        }
        
        return "Je suis actuellement en mode local (les services IA sont temporairement indisponibles). Je peux vous aider avec des questions basiques sur la plateforme PFE. Réessayez dans quelques instants pour des réponses complètes !";
    }
}
