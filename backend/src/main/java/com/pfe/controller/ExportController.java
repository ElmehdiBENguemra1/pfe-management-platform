package com.pfe.controller;

import com.pfe.entity.Project;
import com.pfe.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/admin/export")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ExportController {

    private final ProjectRepository projectRepository;

    @GetMapping("/projects/excel")
    public ResponseEntity<byte[]> exportProjectsToExcel() throws IOException {
        List<Project> projects = projectRepository.findAll();

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Projects");

            // Header
            Row headerRow = sheet.createRow(0);
            String[] columns = {"ID", "Topic", "Student", "Supervisor", "Company", "Status", "Progress", "Start Date"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                CellStyle style = workbook.createCellStyle();
                Font font = workbook.createFont();
                font.setBold(true);
                style.setFont(font);
                cell.setCellStyle(style);
            }

            // Data
            int rowIdx = 1;
            for (Project project : projects) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(project.getId());
                row.createCell(1).setCellValue(project.getTopic().getTitle());
                row.createCell(2).setCellValue(project.getStudent().getFirstName() + " " + project.getStudent().getLastName());
                row.createCell(3).setCellValue(project.getSupervisor().getFirstName() + " " + project.getSupervisor().getLastName());
                row.createCell(4).setCellValue(project.getCompany() != null ? project.getCompany().getCompanyName() : "N/A");
                row.createCell(5).setCellValue(project.getStatus().toString());
                row.createCell(6).setCellValue(project.getProgress() + "%");
                row.createCell(7).setCellValue(project.getStartDate() != null ? project.getStartDate().toString() : "");
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=projects.xlsx")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(out.toByteArray());
        }
    }

    @GetMapping("/projects/csv")
    public ResponseEntity<String> exportProjectsToCsv() {
        List<Project> projects = projectRepository.findAll();
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Topic,Student,Supervisor,Company,Status,Progress,Start Date\n");

        for (Project project : projects) {
            csv.append(project.getId()).append(",")
               .append("\"").append(project.getTopic().getTitle()).append("\",")
               .append("\"").append(project.getStudent().getFirstName()).append(" ").append(project.getStudent().getLastName()).append("\",")
               .append("\"").append(project.getSupervisor().getFirstName()).append(" ").append(project.getSupervisor().getLastName()).append("\",")
               .append("\"").append(project.getCompany() != null ? project.getCompany().getCompanyName() : "N/A").append("\",")
               .append(project.getStatus()).append(",")
               .append(project.getProgress()).append("%,")
               .append(project.getStartDate() != null ? project.getStartDate() : "").append("\n");
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=projects.csv")
                .contentType(MediaType.TEXT_PLAIN)
                .body(csv.toString());
    }
}
