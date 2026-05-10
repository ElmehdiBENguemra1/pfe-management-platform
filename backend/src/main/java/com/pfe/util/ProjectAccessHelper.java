package com.pfe.util;

import com.pfe.entity.Project;
import com.pfe.entity.User;
import com.pfe.enums.Role;
import com.pfe.exception.ResourceNotFoundException;
import com.pfe.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ProjectAccessHelper {

    private final ProjectRepository projectRepository;

    public Project getProjectAndCheckAccess(Long projectId, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        
        assertUserBelongsToProject(project, user);
        return project;
    }

    public void assertUserBelongsToProject(Project project, User user) {
        boolean belongs =
            user.getRole() == Role.ADMIN ||
            project.getStudent().getId().equals(user.getId()) ||
            project.getSupervisor().getId().equals(user.getId()) ||
            (project.getCompany() != null &&
             project.getCompany().getUser() != null &&
             project.getCompany().getUser().getId().equals(user.getId()));
        
        if (!belongs) {
            throw new AccessDeniedException("You do not have access to project " + project.getId());
        }
    }
}
