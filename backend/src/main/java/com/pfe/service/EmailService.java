package com.pfe.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.base-url}")
    private String baseUrl;

    public void sendPasswordResetEmail(String toEmail, String name, String token) {
        log.info("Tentative d'envoi d'email de réinitialisation à : {}", toEmail);
        try {
            Context context = new Context();
            context.setVariable("name", name);
            context.setVariable("token", token);
            context.setVariable("resetUrl", baseUrl + "/reset-password?token=" + token);

            String htmlContent = templateEngine.process("emails/password-reset", context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Password Reset Request - PFE Manager");
            helper.setText(htmlContent, true);

            log.info("**************************************************");
            log.info("CODE DE RÉINITIALISATION POUR {} : {}", toEmail, token);
            log.info("**************************************************");

            mailSender.send(message);
            log.info("Email de réinitialisation envoyé avec succès à : {}", toEmail);
        } catch (Exception e) {
            log.error("ÉCHEC DE L'ENVOI D'EMAIL à {} : {}", toEmail, e.getMessage());
            log.warn("UTILISEZ LE CODE CI-DESSUS DANS LES LOGS POUR VOS TESTS.");
            // We don't rethrow here so the frontend can proceed to the next step in demo mode
        }
    }
}
