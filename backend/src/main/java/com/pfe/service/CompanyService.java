package com.pfe.service;

import com.pfe.entity.*;
import com.pfe.enums.ApplicationStatus;
import com.pfe.enums.ProjectStatus;
import com.pfe.enums.TopicStatus;
import com.pfe.exception.ResourceNotFoundException;
import com.pfe.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class CompanyService {

    private final TopicRepository topicRepository;
    private final ApplicationRepository applicationRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;

    public Map<String, Object> getDashboardStats(User companyUser) {
        Map<String, Object> stats = new HashMap<>();
        
        long activeOffers = topicRepository.countByCreatedBy_IdAndStatus(companyUser.getId(), TopicStatus.APPROVED);
        long pendingApps = applicationRepository.countByTopicCreatedByIdAndStatus(companyUser.getId(), ApplicationStatus.PENDING);
        long activeInterns = projectRepository.countByCompanyIdAndStatusNot(
            companyUser.getCompany().getId(), ProjectStatus.COMPLETED
        );

        stats.put("activeOffers", activeOffers);
        stats.put("pendingApplications", pendingApps);
        stats.put("activeInterns", activeInterns);
        
        return stats;
    }

    public List<com.pfe.dto.response.UserResponse> getSuggestedStudents(User companyUser) {
        // Simple skill-based matching logic
        List<Topic> companyTopics = topicRepository.findByCreatedBy_Id(companyUser.getId());
        Set<String> requiredSkills = companyTopics.stream()
            .filter(t -> t.getRequiredSkills() != null)
            .flatMap(t -> Arrays.stream(t.getRequiredSkills().split(",")))
            .map(String::trim)
            .map(String::toLowerCase)
            .collect(Collectors.toSet());

        if (requiredSkills.isEmpty()) return new ArrayList<>();

        List<User> students = userRepository.findByRole(com.pfe.enums.Role.STUDENT);
        
        return students.stream()
            .filter(s -> s.getStudentProfile() != null && s.getStudentProfile().getSkills() != null)
            .sorted((s1, s2) -> {
                long match1 = countMatches(s1.getStudentProfile().getSkills(), requiredSkills);
                long match2 = countMatches(s2.getStudentProfile().getSkills(), requiredSkills);
                return Long.compare(match2, match1); // Descending
            })
            .limit(5)
            .map(this::mapToUserResponse)
            .collect(Collectors.toList());
    }

    private com.pfe.dto.response.UserResponse mapToUserResponse(User user) {
        if (user == null) return null;
        return com.pfe.dto.response.UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .role(user.getRole())
                .studentId(user.getStudentProfile() != null ? user.getStudentProfile().getStudentId() : null)
                .department(user.getStudentProfile() != null ? user.getStudentProfile().getDepartment() : null)
                .level(user.getStudentProfile() != null ? user.getStudentProfile().getLevel() : null)
                .skills(user.getStudentProfile() != null ? user.getStudentProfile().getSkills() : null)
                .build();
    }

    private long countMatches(String studentSkills, Set<String> required) {
        if (studentSkills == null) return 0;
        return Arrays.stream(studentSkills.split(","))
            .map(String::trim)
            .map(String::toLowerCase)
            .filter(required::contains)
            .count();
    }

    @Transactional
    public void updateCompanyProfile(User user, Map<String, Object> profileData) {
        Company company = companyRepository.findByUserId(user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
        
        if (profileData.containsKey("companyName")) company.setCompanyName((String) profileData.get("companyName"));
        if (profileData.containsKey("description")) company.setDescription((String) profileData.get("description"));
        if (profileData.containsKey("sector")) company.setSector((String) profileData.get("sector"));
        if (profileData.containsKey("address")) company.setAddress((String) profileData.get("address"));
        if (profileData.containsKey("website")) company.setWebsite((String) profileData.get("website"));
        if (profileData.containsKey("logoUrl")) company.setLogoUrl((String) profileData.get("logoUrl"));
        if (profileData.containsKey("size")) company.setSize((String) profileData.get("size"));
        if (profileData.containsKey("expertise")) company.setExpertise((String) profileData.get("expertise"));
        
        companyRepository.save(company);
    }
}
