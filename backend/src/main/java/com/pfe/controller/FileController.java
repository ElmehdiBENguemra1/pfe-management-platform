package com.pfe.controller;

import com.pfe.entity.User;
import com.pfe.exception.BadRequestException;
import com.pfe.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final AuthService authService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @PostMapping("/upload-cv")
    public ResponseEntity<Map<String, String>> uploadCv(@RequestParam("file") MultipartFile file,
                                                        @AuthenticationPrincipal User user) {
        if (file.isEmpty()) {
            throw new BadRequestException("Please select a file to upload");
        }

        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String originalFileName = file.getOriginalFilename();
            String storedFileName = "cv_" + user.getId() + "_" + UUID.randomUUID() + "_" + originalFileName;
            Path targetLocation = uploadPath.resolve(storedFileName);

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Update user's CV URL in the database
            authService.updateStudentCv(user, storedFileName);

            return ResponseEntity.ok(Map.of(
                "fileName", originalFileName,
                "url", "/api/files/download/" + storedFileName
            ));
        } catch (IOException e) {
            throw new BadRequestException("Could not store file. Error: " + e.getMessage());
        }
    }

    @GetMapping("/download/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
        try {
            Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(fileName);
            @SuppressWarnings("null")
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                String contentType = "application/octet-stream";
                try {
                    contentType = Files.probeContentType(filePath);
                } catch (IOException e) {
                    // Fallback to basic check if probe fails
                    if (fileName.toLowerCase().endsWith(".pdf")) {
                        contentType = "application/pdf";
                    }
                }
                
                if (contentType == null) contentType = "application/octet-stream";

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
