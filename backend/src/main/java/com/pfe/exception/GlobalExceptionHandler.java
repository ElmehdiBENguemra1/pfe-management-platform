package com.pfe.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.nio.file.AccessDeniedException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 401 — Bad credentials
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(new ErrorResponse(401, "Authentification échouée", "Email ou mot de passe incorrect."));
    }

    // 403 — Access denied
    @ExceptionHandler({
        AccessDeniedException.class,
        org.springframework.security.access.AccessDeniedException.class
    })
    public ResponseEntity<ErrorResponse> handleAccessDenied(Exception ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(new ErrorResponse(403, "Accès refusé", "Vous n'avez pas les permissions nécessaires pour effectuer cette action."));
    }

    // 404 — Resource not found
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(404, "Non trouvé", "La ressource demandée n'existe pas ou a été déplacée."));
    }

    // 400 — Bad request
    @ExceptionHandler({
        BadRequestException.class,
        MethodArgumentNotValidException.class,
        IllegalArgumentException.class
    })
    public ResponseEntity<ErrorResponse> handleBadRequest(Exception ex) {
        String message = ex instanceof MethodArgumentNotValidException
            ? "Certains champs du formulaire sont invalides."
            : ex.getMessage();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse(400, "Requête invalide", message));
    }

    // 409 — Conflict
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDuplicate(
            org.springframework.dao.DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new ErrorResponse(409, "Doublon détecté",
                "Ces données existent déjà dans notre système (ex: email déjà utilisé)."));
    }

    // 503 — Service Unavailable (Mail)
    @ExceptionHandler(MailException.class)
    public ResponseEntity<ErrorResponse> handleMailException(MailException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(new ErrorResponse(503, "Service indisponible", "Le service d'envoi d'emails est temporairement indisponible. Veuillez réessayer plus tard."));
    }

    // 500 — Catch-all
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        ex.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse(500, "Erreur système",
                "Une erreur imprévue est survenue sur nos serveurs. Notre équipe a été notifiée."));
    }
}
