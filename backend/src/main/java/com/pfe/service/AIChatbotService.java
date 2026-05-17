package com.pfe.service;

import com.pfe.dto.response.AIChatResponse;
import com.pfe.entity.*;
import com.pfe.enums.*;
import com.pfe.repository.ApplicationRepository;
import com.pfe.repository.TopicRepository;
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
    private final TopicRepository topicRepository;
    private final ApplicationRepository applicationRepository;

    // Gemini models to try (2.5-flash often has quota, so we try multiple)
    private static final String[] GEMINI_MODELS = {
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite"
    };

    private static final String GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models/";

    // ===================== POLLINATIONS CONFIG (FREE, NO KEY) =====================
    private static final String POLLINATIONS_URL = "https://text.pollinations.ai/openai";
    private static final String POLLINATIONS_MODEL = "openai-fast";

    @jakarta.annotation.PostConstruct
    public void init() {
        log.info("==================================================");
        log.info("SmartPFE AI Chatbot initialized");
        log.info("Gemini key: {}", geminiApiKey != null && !geminiApiKey.isEmpty() ? "PRESENT" : "MISSING");
        log.info("Pollinations: READY (free, no key)");
        log.info("==================================================");
    }

    // ========================= MAIN ENTRY POINT =========================

    public AIChatResponse getChatResponse(String message, User user) {
        String systemPrompt = buildSystemPrompt(user);

        // 1. Primary: Pollinations AI (FREE, no quota, always available)
        try {
            AIChatResponse resp = callPollinations(systemPrompt, message);
            if (resp != null) return resp;
        } catch (Exception e) {
            log.warn("Pollinations failed: {}", e.getMessage());
        }

        // 2. Secondary: Gemini (has quota limits but very smart)
        if (geminiApiKey != null && !geminiApiKey.isEmpty()) {
            for (String model : GEMINI_MODELS) {
                try {
                    AIChatResponse resp = callGemini(systemPrompt, message, model);
                    if (resp != null) return resp;
                } catch (Exception e) {
                    log.warn("Gemini '{}' failed: {}", model, e.getMessage());
                }
            }
        }

        // 3. Last resort: smart local fallback
        return AIChatResponse.builder()
                .response(getLocalResponse(message, user))
                .modelUsed("SmartPFE Assistant")
                .build();
    }

    // ========================= SYSTEM PROMPT =========================

    private String buildSystemPrompt(User user) {
        StringBuilder sb = new StringBuilder();

        // --- Core identity ---
        sb.append("You are SmartPFE, an intelligent AI assistant for a university PFE (Final Year Project) management platform.\n");
        sb.append("CRITICAL RULE: Always reply in the EXACT SAME language the user writes in. If they write in Arabic, reply in Arabic. French → French. English → English. Etc.\n");
        sb.append("Be exceptionally brief, direct, and concise. Avoid wordy introductions, greetings, or conclusions. Summarize long explanations aggressively. MAXIMUM RESPONSE LENGTH: 150 words.\n");
        sb.append("Follow these strict formatting rules to ensure maximum readability:\n");
        sb.append("1. Always insert an empty line break between sections, paragraphs, and list items (use double newlines \\n\\n for separation).\n");
        sb.append("2. Use bold headers (e.g. **1. [Topic Title]** or **Étape 1 : [Titre]**) for steps or recommendations. Go to a new line before writing the description.\n");
        sb.append("3. Keep bullet point descriptions extremely short and punchy (maximum 1 sentence per point).\n");
        sb.append("4. Use emojis tastefully (max 1 per major section) to highlight key points.\n");
        sb.append("5. Highlight important information or warnings on a new line using '💡 **Note :**' or '⚠️ **Attention :**'.\n\n");

        // --- Current user info ---
        sb.append("Current user: ").append(user.getFirstName()).append(" ").append(user.getLastName());
        sb.append(" | Role: ").append(user.getRole()).append("\n");

        // --- STUDENT context ---
        if (user.getRole() == Role.STUDENT) {
            if (user.getStudentProfile() != null) {
                StudentProfile sp = user.getStudentProfile();
                if (sp.getSkills() != null) sb.append("Student skills: ").append(sp.getSkills()).append("\n");
                if (sp.getLevel() != null) sb.append("Level: ").append(sp.getLevel()).append("\n");
                if (sp.getBio() != null) sb.append("Bio/Interests: ").append(sp.getBio()).append("\n");
            }
            appendAvailableTopics(sb);
            sb.append("\nWhen the student asks for topic recommendations, compare their skills with the required skills of available topics and suggest the TOP 3 best matches. Format each recommendation clearly:\n");
            sb.append("**[Rank]. [Topic Title]**\n");
            sb.append("• *Pourquoi ce choix :* [Brief explanation of why it fits]\n");
            sb.append("• *Compétences correspondantes :* [Matching skills]\n\n");
        }

        // --- SUPERVISOR context ---
        else if (user.getRole() == Role.SUPERVISOR) {
            appendSupervisorTopicsWithCandidates(sb, user);
            sb.append("\nWhen the supervisor asks for best candidates, analyze each student's skills, motivation, and level against the topic requirements. Rank candidates and explain your reasoning using clear, spaced sections.\n");
        }

        // --- COMPANY context ---
        else if (user.getRole() == Role.COMPANY) {
            if (user.getCompany() != null) {
                sb.append("Company: ").append(user.getCompany().getCompanyName());
                sb.append(" | Sector: ").append(user.getCompany().getSector()).append("\n");
            }
            appendAvailableTopics(sb);
        }

        // --- General knowledge ---
        sb.append("\nYou can also answer general knowledge questions, help with coding problems, explain academic concepts, and assist with any topic the user asks about.\n");
        sb.append("For platform-specific questions: the platform has pages for Topics, Applications, Projects, Profile, and Notifications.\n");

        return sb.toString();
    }

    private void appendAvailableTopics(StringBuilder sb) {
        List<Topic> topics = topicRepository.findByStatus(TopicStatus.APPROVED);
        if (!topics.isEmpty()) {
            sb.append("\n📋 Available PFE Topics (").append(topics.size()).append("):\n");
            for (Topic t : topics) {
                sb.append("• [").append(t.getTitle()).append("]");
                if (t.getDomain() != null) sb.append(" — Domain: ").append(t.getDomain());
                if (t.getRequiredSkills() != null) sb.append(" — Skills: ").append(t.getRequiredSkills());
                if (t.getRequiredLevel() != null) sb.append(" — Level: ").append(t.getRequiredLevel());
                if (t.getType() != null) sb.append(" — Type: ").append(t.getType());
                if (t.getCreatedBy() != null) sb.append(" — By: ").append(t.getCreatedBy().getFirstName()).append(" ").append(t.getCreatedBy().getLastName());
                sb.append("\n");
            }
        } else {
            sb.append("\nNo PFE topics are currently available.\n");
        }
    }

    private void appendSupervisorTopicsWithCandidates(StringBuilder sb, User supervisor) {
        // Get topics created by this supervisor
        List<Topic> myTopics = topicRepository.findByCreatedBy_Id(supervisor.getId());
        if (!myTopics.isEmpty()) {
            sb.append("\n📋 Your proposed topics and their candidates:\n");
            for (Topic t : myTopics) {
                sb.append("\n🔹 Topic: [").append(t.getTitle()).append("] (Status: ").append(t.getStatus()).append(")\n");
                if (t.getRequiredSkills() != null) sb.append("   Required skills: ").append(t.getRequiredSkills()).append("\n");

                // Get applications for this topic
                List<Application> apps = applicationRepository.findByTopicId(t.getId());
                if (!apps.isEmpty()) {
                    sb.append("   Candidates (").append(apps.size()).append("):\n");
                    for (Application app : apps) {
                        User student = app.getStudent();
                        sb.append("   • ").append(student.getFirstName()).append(" ").append(student.getLastName());
                        sb.append(" (Status: ").append(app.getStatus()).append(")");
                        if (student.getStudentProfile() != null) {
                            StudentProfile sp = student.getStudentProfile();
                            if (sp.getSkills() != null) sb.append(" — Skills: ").append(sp.getSkills());
                            if (sp.getLevel() != null) sb.append(" — Level: ").append(sp.getLevel());
                        }
                        if (app.getMotivationText() != null) {
                            String motivation = app.getMotivationText();
                            sb.append(" — Motivation: ").append(motivation.length() > 100 ? motivation.substring(0, 100) + "..." : motivation);
                        }
                        sb.append("\n");
                    }
                } else {
                    sb.append("   No candidates yet.\n");
                }
            }
        } else {
            sb.append("\nYou haven't proposed any topics yet.\n");
        }
    }

    // ========================= POLLINATIONS AI (PRIMARY) =========================

    private AIChatResponse callPollinations(String systemPrompt, String message) {
        log.info("Calling Pollinations AI (openai-fast)...");
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", POLLINATIONS_MODEL);

        List<Map<String, String>> messages = new ArrayList<>();

        Map<String, String> sysMsg = new HashMap<>();
        sysMsg.put("role", "system");
        sysMsg.put("content", systemPrompt);
        messages.add(sysMsg);

        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", message);
        messages.add(userMsg);

        requestBody.put("messages", messages);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                POLLINATIONS_URL,
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
                if (text != null && !text.trim().isEmpty()) {
                    log.info("Pollinations AI responded successfully");
                    return AIChatResponse.builder()
                            .response(text.trim())
                            .modelUsed("SmartPFE AI")
                            .build();
                }
            }
        }
        return null;
    }

    // ========================= GEMINI (SECONDARY) =========================

    private AIChatResponse callGemini(String systemPrompt, String message, String model) {
        log.info("Trying Gemini model: {}", model);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String combinedPrompt = systemPrompt + "\n\nUser message: " + message;

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> contents = new HashMap<>();
        Map<String, Object> parts = new HashMap<>();
        parts.put("text", combinedPrompt);
        contents.put("parts", Collections.singletonList(parts));
        requestBody.put("contents", Collections.singletonList(contents));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        String url = GEMINI_BASE + model + ":generateContent?key=" + geminiApiKey;

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url, HttpMethod.POST, entity,
                new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
        );

        Map<String, Object> body = response.getBody();
        if (response.getStatusCode() == HttpStatus.OK && body != null) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> partsList = (List<Map<String, Object>>) content.get("parts");
                String text = (String) partsList.get(0).get("text");
                log.info("Gemini '{}' responded successfully", model);
                return AIChatResponse.builder()
                        .response(text.trim())
                        .modelUsed("SmartPFE AI")
                        .build();
            }
        }
        throw new RuntimeException("Gemini '" + model + "' returned no response");
    }

    // ========================= LOCAL FALLBACK =========================

    private String getLocalResponse(String message, User user) {
        String lower = message.toLowerCase();
        String name = user.getFirstName();

        if (lower.matches(".*(bonjour|salut|hello|hi|مرحبا|السلام|salam).*")) {
            return "👋 Bonjour " + name + " ! Je suis l'assistant SmartPFE. Comment puis-je vous aider ?";
        }
        if (lower.contains("date") || lower.contains("aujourd") || lower.contains("تاريخ")) {
            return "📅 " + java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        }
        if (lower.contains("heure") || lower.contains("time") || lower.contains("وقت") || lower.contains("ساعة")) {
            return "🕐 " + java.time.LocalTime.now().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm"));
        }
        if (lower.matches(".*(sujet|topic|recommand|suggest|propose|اقتراح|موضوع).*")) {
            List<Topic> topics = topicRepository.findByStatus(TopicStatus.APPROVED);
            if (!topics.isEmpty()) {
                StringBuilder sb = new StringBuilder("📋 Sujets disponibles :\n");
                for (Topic t : topics) {
                    sb.append("• ").append(t.getTitle());
                    if (t.getDomain() != null) sb.append(" (").append(t.getDomain()).append(")");
                    sb.append("\n");
                }
                sb.append("\n💡 Les services IA sont temporairement indisponibles pour des recommandations personnalisées. Réessayez dans quelques instants !");
                return sb.toString();
            }
            return "Aucun sujet disponible pour le moment.";
        }
        if (lower.matches(".*(merci|thank|شكرا).*")) {
            return "😊 De rien " + name + " ! N'hésitez pas si vous avez d'autres questions.";
        }
        if (lower.matches(".*(aide|help|مساعدة).*")) {
            return "Je peux vous aider avec :\n• 📋 Recommandations de sujets PFE\n• 👥 Meilleurs candidats (pour les profs)\n• 📊 Navigation sur la plateforme\n• 💬 Questions générales\n\n⏳ Les services IA sont temporairement indisponibles. Réessayez bientôt !";
        }

        return "⏳ Les services IA sont temporairement chargés. Réessayez dans quelques secondes, " + name + " !";
    }
}
