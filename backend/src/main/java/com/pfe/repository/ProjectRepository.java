package com.pfe.repository;

import com.pfe.entity.Project;
import com.pfe.enums.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByStudentId(Long studentId);
    List<Project> findBySupervisorId(Long supervisorId);
    List<Project> findByCompanyId(Long companyId);
    List<Project> findByStatus(ProjectStatus status);
    long countByStatus(ProjectStatus status);
    long countByArchivedTrue();
    long countBySupervisorIdAndStatusNot(Long supervisorId, ProjectStatus status);
    long countByCompanyIdAndStatusNot(Long companyId, ProjectStatus status);
}
