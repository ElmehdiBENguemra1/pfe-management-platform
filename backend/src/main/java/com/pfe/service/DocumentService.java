package com.pfe.service;

import com.pfe.entity.Document;
import com.pfe.entity.Project;
import com.pfe.entity.User;
import com.pfe.dto.response.DocumentResponse;
import com.pfe.enums.DocumentStatus;
import com.pfe.enums.DocumentType;
import com.pfe.enums.Role;
import com.pfe.exception.BadRequestException;
import com.pfe.exception.ResourceNotFoundException;
import com.pfe.repository.DocumentRepository;
import com.pfe.util.ProjectAccessHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.AccessDeniedException;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final NotificationService notificationService;
    private final ProjectAccessHelper projectAccessHelper;
    private final ChatService chatService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public List<DocumentResponse> getProjectDocuments(Long projectId, User user) {
        projectAccessHelper.getProjectAndCheckAccess(projectId, user);
        
        return documentRepository.findByProjectId(projectId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DocumentResponse uploadDocument(Long projectId, MultipartFile file,
                                            DocumentType documentType, User user) {
        if (user == null) {
            throw new BadRequestException("User not authenticated");
        }
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is missing or empty");
        }
        if (user.getRole() != Role.STUDENT) {
            throw new AccessDeniedException("Only the student assigned to this project can upload documents.");
        }

        Project project = projectAccessHelper.getProjectAndCheckAccess(projectId, user);

        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String originalFileName = file.getOriginalFilename();
            String storedFileName = UUID.randomUUID() + "_" + originalFileName;
            Path targetLocation = uploadPath.resolve(storedFileName);

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            Document document = Document.builder()
                    .project(project)
                    .uploadedBy(user)
                    .fileName(originalFileName)
                    .filePath(storedFileName)
                    .documentType(documentType)
                    .status(DocumentStatus.PENDING)
                    .build();

            document = documentRepository.save(document);

            // Generate System Message
            chatService.createSystemMessage(
                    projectId,
                    com.pfe.enums.MessageType.DOCUMENT_REF,
                    document.getId(),
                    user.getFirstName() + " a déposé \"" + originalFileName + "\""
            );

            // Notify the supervisor
            notificationService.createNotification(
                    project.getSupervisor().getId(),
                    "New document uploaded by " + user.getFirstName() + " " + user.getLastName() +
                            " for project \"" + project.getTopic().getTitle() + "\": " + originalFileName
            );

            return mapToResponse(document);
        } catch (IOException e) {
            throw new BadRequestException("Failed to upload file: " + e.getMessage());
        }
    }

    public Resource downloadDocument(Long id, User user) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        
        projectAccessHelper.assertUserBelongsToProject(document.getProject(), user);

        try {
            Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize()
                    .resolve(document.getFilePath());
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("File not found: " + document.getFileName());
            }
        } catch (MalformedURLException e) {
            throw new BadRequestException("File not found: " + e.getMessage());
        }
    }

    @Transactional
    public void validateDocument(Long id, DocumentStatus status, String comment, User user) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        
        projectAccessHelper.assertUserBelongsToProject(document.getProject(), user);

        // Additional role check for validation (Supervisor only)
        if (user.getRole() != Role.SUPERVISOR && user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only supervisors can validate or request revisions for documents.");
        }

        document.setStatus(status);
        document.setRevisionComment(comment);
        documentRepository.save(document);

        // Notify the student
        notificationService.createNotification(
                document.getProject().getStudent().getId(),
                "Your document \"" + document.getFileName() + "\" has been " + 
                (status == DocumentStatus.VALIDATED ? "validated" : "marked for revision") + 
                " by " + user.getFirstName() + " " + user.getLastName()
        );
    }

    public String getDocumentFileName(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        return document.getFileName();
    }

    @Transactional
    public void deleteDocument(Long id, User user) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        projectAccessHelper.assertUserBelongsToProject(document.getProject(), user);

        if (!document.getUploadedBy().getId().equals(user.getId()) &&
                user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("You can only delete your own documents");
        }
        
        // Block delete if already validated (except for Admin)
        if (document.getStatus() == DocumentStatus.VALIDATED && user.getRole() != Role.ADMIN) {
            throw new BadRequestException("Cannot delete a validated document.");
        }

        // Delete the physical file
        try {
            Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize()
                    .resolve(document.getFilePath());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Log but don't fail
        }

        documentRepository.delete(document);
    }

    private DocumentResponse mapToResponse(Document document) {
        return DocumentResponse.builder()
                .id(document.getId())
                .projectId(document.getProject().getId())
                .fileName(document.getFileName())
                .documentType(document.getDocumentType())
                .status(document.getStatus())
                .revisionComment(document.getRevisionComment())
                .uploadedByName(document.getUploadedBy().getFirstName() + " " + document.getUploadedBy().getLastName())
                .uploadedById(document.getUploadedBy().getId())
                .uploadedAt(document.getUploadedAt())
                .build();
    }
}
