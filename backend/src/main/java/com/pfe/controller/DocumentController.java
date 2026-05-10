package com.pfe.controller;

import com.pfe.dto.response.DocumentResponse;
import com.pfe.entity.User;
import com.pfe.enums.DocumentType;
import com.pfe.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@SuppressWarnings("null")
public class DocumentController {

    private final DocumentService documentService;

    @GetMapping("/projects/{projectId}/documents")
    public ResponseEntity<List<DocumentResponse>> getProjectDocuments(@PathVariable Long projectId,
                                                                     @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(documentService.getProjectDocuments(projectId, user));
    }

    @PostMapping("/projects/{projectId}/documents")
    public ResponseEntity<DocumentResponse> uploadDocument(@PathVariable Long projectId,
                                                            @RequestParam("file") MultipartFile file,
                                                            @RequestParam("type") DocumentType type,
                                                            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(documentService.uploadDocument(projectId, file, type, user));
    }

    @GetMapping("/documents/{id}/download")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long id,
                                                    @AuthenticationPrincipal User user) {
        Resource resource = documentService.downloadDocument(id, user);
        String fileName = documentService.getDocumentFileName(id);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(resource);
    }

    @PutMapping("/documents/{id}/review")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('SUPERVISOR', 'ADMIN')")
    public ResponseEntity<Void> validateDocument(@PathVariable Long id,
                                                @RequestBody java.util.Map<String, String> review,
                                                @AuthenticationPrincipal User user) {
        com.pfe.enums.DocumentStatus status = com.pfe.enums.DocumentStatus.valueOf(review.get("status"));
        String comment = review.get("comment");
        documentService.validateDocument(id, status, comment, user);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id,
                                                @AuthenticationPrincipal User user) {
        documentService.deleteDocument(id, user);
        return ResponseEntity.noContent().build();
    }
}
