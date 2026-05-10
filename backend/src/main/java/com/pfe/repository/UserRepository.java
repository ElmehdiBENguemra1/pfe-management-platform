package com.pfe.repository;

import com.pfe.entity.User;
import com.pfe.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    boolean existsByEmail(String email);
    List<User> findByRole(Role role);
    long countByRole(Role role);
    long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
    List<User> findByRoleAndStudentProfileIsNull(Role role); // Anomaly: Student without profile? No, usually it's Student without supervisor in a project.
}
