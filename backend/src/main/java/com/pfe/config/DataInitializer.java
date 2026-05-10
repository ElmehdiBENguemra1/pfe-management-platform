package com.pfe.config;

import com.pfe.entity.*;
import com.pfe.enums.*;
import com.pfe.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TopicRepository topicRepository;
    private final ApplicationRepository applicationRepository;
    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        try {
            jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN status VARCHAR(255)");
            log.info("Successfully altered users status column to VARCHAR to support DELETED status.");
        } catch (Exception e) {
            log.warn("Could not alter users status column (might already be altered or DB issue): " + e.getMessage());
        }

        if (userRepository.count() > 0) {
            log.info("Database already populated, skipping initialization.");
            return;
        }

        log.info("Initializing database with sample data...");

        String encodedPassword = passwordEncoder.encode("Password@123");

        // === ADMIN ===
        userRepository.save(User.builder()
                .email("admin@pfe.com")
                .phone("0600000001")
                .password(encodedPassword)
                .firstName("Admin")
                .lastName("System")
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .build());

        // === SUPERVISORS ===
        User supervisor1 = userRepository.save(User.builder()
                .email("prof.ahmed@pfe.com")
                .phone("0600000002")
                .password(encodedPassword)
                .firstName("Ahmed")
                .lastName("Benali")
                .role(Role.SUPERVISOR)
                .status(UserStatus.ACTIVE)
                .build());
        supervisor1.setSupervisorProfile(SupervisorProfile.builder()
                .user(supervisor1)
                .department("Computer Science")
                .specialization("Artificial Intelligence")
                .build());
        supervisor1 = userRepository.save(supervisor1);

        User supervisor2 = userRepository.save(User.builder()
                .email("prof.sara@pfe.com")
                .phone("0600000003")
                .password(encodedPassword)
                .firstName("Sara")
                .lastName("Mansouri")
                .role(Role.SUPERVISOR)
                .status(UserStatus.ACTIVE)
                .build());
        supervisor2.setSupervisorProfile(SupervisorProfile.builder()
                .user(supervisor2)
                .department("Computer Science")
                .specialization("Web Development & Cloud Computing")
                .build());
        supervisor2 = userRepository.save(supervisor2);

        // === STUDENTS ===
        User student1 = userRepository.save(User.builder()
                .email("student1@pfe.com")
                .phone("0600000004")
                .password(encodedPassword)
                .firstName("Youssef")
                .lastName("Amrani")
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .build());
        student1.setStudentProfile(StudentProfile.builder()
                .user(student1)
                .studentId("STU2024001")
                .department("Computer Science")
                .level(Level.L3)
                .build());
        student1 = userRepository.save(student1);

        User student2 = userRepository.save(User.builder()
                .email("student2@pfe.com")
                .phone("0600000005")
                .password(encodedPassword)
                .firstName("Fatima")
                .lastName("Zahra")
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .build());
        student2.setStudentProfile(StudentProfile.builder()
                .user(student2)
                .studentId("STU2024002")
                .department("Computer Science")
                .level(Level.L3)
                .build());
        student2 = userRepository.save(student2);

        User student3 = userRepository.save(User.builder()
                .email("student3@pfe.com")
                .phone("0600000006")
                .password(encodedPassword)
                .firstName("Omar")
                .lastName("Idrissi")
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .build());
        student3.setStudentProfile(StudentProfile.builder()
                .user(student3)
                .studentId("STU2024003")
                .department("Information Systems")
                .level(Level.M2)
                .build());
        student3 = userRepository.save(student3);

        // === REAL TEST USER ===
        User testUser = userRepository.save(User.builder()
                .email("benguemramehdi715@gmail.com")
                .phone("0611223344")
                .password(encodedPassword)
                .firstName("Mehdi")
                .lastName("Benguemra")
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .build());
        testUser.setStudentProfile(StudentProfile.builder()
                .user(testUser)
                .studentId("STU-REAL")
                .department("External")
                .level(Level.M1)
                .build());
        testUser = userRepository.save(testUser);

        // === COMPANY ===
        User companyUser = userRepository.save(User.builder()
                .email("contact@techcorp.com")
                .phone("0600000007")
                .password(encodedPassword)
                .firstName("TechCorp")
                .lastName("HR")
                .role(Role.COMPANY)
                .status(UserStatus.ACTIVE)
                .build());
        companyUser.setCompany(Company.builder()
                .user(companyUser)
                .companyName("TechCorp Solutions")
                .sector("Information Technology")
                .address("123 Innovation Street, Casablanca")
                .website("https://techcorp.ma")
                .build());
        companyUser = userRepository.save(companyUser);

        // === TOPICS ===
        Topic topic1 = topicRepository.save(Topic.builder()
                .title("AI-Powered Student Performance Prediction System")
                .description("Develop a machine learning system that predicts student academic performance based on historical data, attendance patterns, and engagement metrics. The system should provide early intervention recommendations.")
                .requiredSkills("Python, Machine Learning, scikit-learn, Data Analysis")
                .type(TopicType.PFE)
                .duration("4 months")
                .status(TopicStatus.APPROVED)
                .createdBy(supervisor1)
                .build());

        Topic topic2 = topicRepository.save(Topic.builder()
                .title("Cloud-Native Microservices E-Commerce Platform")
                .description("Build a scalable e-commerce platform using microservices architecture with Spring Boot, Docker, and Kubernetes. Implement service discovery, API gateway, and distributed tracing.")
                .requiredSkills("Java, Spring Boot, Docker, Kubernetes, MySQL")
                .type(TopicType.PFE)
                .duration("5 months")
                .status(TopicStatus.APPROVED)
                .createdBy(supervisor2)
                .build());

        Topic topic3 = topicRepository.save(Topic.builder()
                .title("Mobile App Development Internship")
                .description("Join our mobile development team to build cross-platform applications using React Native. Work on real client projects and learn modern development practices.")
                .requiredSkills("React Native, JavaScript, REST APIs, Git")
                .type(TopicType.INTERNSHIP)
                .duration("3 months")
                .status(TopicStatus.APPROVED)
                .createdBy(companyUser)
                .build());

        topicRepository.save(Topic.builder()
                .title("IoT Smart Campus Monitoring System")
                .description("Design and implement an IoT-based monitoring system for campus facilities including temperature, humidity, and energy consumption tracking with real-time dashboards.")
                .requiredSkills("Arduino, Python, MQTT, Web Development, Database Design")
                .type(TopicType.PFE)
                .duration("4 months")
                .status(TopicStatus.APPROVED)
                .createdBy(supervisor1)
                .build());

        topicRepository.save(Topic.builder()
                .title("Blockchain-Based Certificate Verification System")
                .description("Create a decentralized application for verifying academic certificates using blockchain technology to prevent fraud and ensure data integrity.")
                .requiredSkills("Blockchain, Solidity, React.js, Node.js")
                .type(TopicType.PFE)
                .duration("5 months")
                .status(TopicStatus.PENDING)
                .createdBy(supervisor2)
                .build());

        // === APPLICATIONS ===
        Application app1 = applicationRepository.save(Application.builder()
                .topic(topic1)
                .student(student1)
                .motivationText("I am passionate about AI and machine learning. This project aligns perfectly with my career goals and I have prior experience with Python and data analysis.")
                .status(ApplicationStatus.ACCEPTED)
                .build());

        Application app2 = applicationRepository.save(Application.builder()
                .topic(topic3)
                .student(student2)
                .motivationText("I have been developing mobile apps for two years and I'm excited about the opportunity to work on real client projects at TechCorp.")
                .status(ApplicationStatus.ACCEPTED)
                .build());

        applicationRepository.save(Application.builder()
                .topic(topic2)
                .student(student3)
                .motivationText("Microservices architecture is the future of enterprise software. I want to gain hands-on experience with container orchestration and distributed systems.")
                .status(ApplicationStatus.PENDING)
                .build());

        // === PROJECTS ===
        Project project1 = projectRepository.save(Project.builder()
                .application(app1)
                .topic(topic1)
                .student(student1)
                .supervisor(supervisor1)
                .status(ProjectStatus.IN_PROGRESS)
                .progress(35)
                .startDate(LocalDate.of(2024, 9, 15))
                .endDate(LocalDate.of(2025, 1, 15))
                .build());

        Project project2 = projectRepository.save(Project.builder()
                .application(app2)
                .topic(topic3)
                .student(student2)
                .supervisor(supervisor2)
                .company(companyUser.getCompany())
                .status(ProjectStatus.IN_PROGRESS)
                .progress(60)
                .startDate(LocalDate.of(2024, 10, 1))
                .endDate(LocalDate.of(2025, 1, 1))
                .build());

        // === MILESTONES ===
        milestoneRepository.save(Milestone.builder()
                .project(project1)
                .title("Literature Review & State of the Art")
                .description("Research existing prediction systems and machine learning approaches")
                .dueDate(LocalDate.of(2024, 10, 1))
                .status(MilestoneStatus.COMPLETED)
                .build());

        milestoneRepository.save(Milestone.builder()
                .project(project1)
                .title("Data Collection & Preprocessing")
                .description("Gather student data, clean and prepare datasets for model training")
                .dueDate(LocalDate.of(2024, 10, 20))
                .status(MilestoneStatus.COMPLETED)
                .build());

        milestoneRepository.save(Milestone.builder()
                .project(project1)
                .title("Model Development & Training")
                .description("Implement and train ML models, compare performance metrics")
                .dueDate(LocalDate.of(2024, 11, 15))
                .status(MilestoneStatus.IN_PROGRESS)
                .build());

        milestoneRepository.save(Milestone.builder()
                .project(project1)
                .title("Web Dashboard Implementation")
                .description("Build the prediction dashboard with visualization of results")
                .dueDate(LocalDate.of(2024, 12, 15))
                .status(MilestoneStatus.PENDING)
                .build());

        milestoneRepository.save(Milestone.builder()
                .project(project2)
                .title("Environment Setup & App Scaffold")
                .description("Set up React Native development environment and project structure")
                .dueDate(LocalDate.of(2024, 10, 10))
                .status(MilestoneStatus.COMPLETED)
                .build());

        milestoneRepository.save(Milestone.builder()
                .project(project2)
                .title("UI/UX Implementation")
                .description("Implement all screens based on Figma designs")
                .dueDate(LocalDate.of(2024, 11, 1))
                .status(MilestoneStatus.COMPLETED)
                .build());

        milestoneRepository.save(Milestone.builder()
                .project(project2)
                .title("API Integration & Testing")
                .description("Connect to backend APIs and perform thorough testing")
                .dueDate(LocalDate.of(2024, 12, 1))
                .status(MilestoneStatus.IN_PROGRESS)
                .build());

        // === NOTIFICATIONS ===
        notificationRepository.save(Notification.builder()
                .user(student1)
                .content("Your application for \"AI-Powered Student Performance Prediction System\" has been accepted!")
                .read(true)
                .build());

        notificationRepository.save(Notification.builder()
                .user(student1)
                .content("New milestone added: \"Model Development & Training\" - Due: Nov 15, 2024")
                .read(false)
                .build());

        notificationRepository.save(Notification.builder()
                .user(supervisor1)
                .content("You have been assigned as supervisor for: \"AI-Powered Student Performance Prediction System\"")
                .read(true)
                .build());

        log.info("Database initialization completed successfully!");
        log.info("=== Login Credentials ===");
        log.info("Admin:      admin@pfe.com / Password@123");
        log.info("Supervisor: prof.ahmed@pfe.com / Password@123");
        log.info("Supervisor: prof.sara@pfe.com / Password@123");
        log.info("Student:    student1@pfe.com / Password@123");
        log.info("Student:    student2@pfe.com / Password@123");
        log.info("Student:    student3@pfe.com / Password@123");
        log.info("Company:    contact@techcorp.com / Password@123");
        log.info("Real Test:  benguemramehdi715@gmail.com / Password@123");
    }
}
