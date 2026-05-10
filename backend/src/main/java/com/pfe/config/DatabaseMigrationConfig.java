package com.pfe.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseMigrationConfig {

    @Bean
    public CommandLineRunner migrateDatabase(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE chat_messages MODIFY sender_id BIGINT NULL;");
                System.out.println("=======================================================");
                System.out.println("Database schema migrated: sender_id is now nullable");
                System.out.println("=======================================================");
            } catch (Exception e) {
                // Ignore if it fails (e.g. table doesn't exist yet)
                System.out.println("Migration note: " + e.getMessage());
            }
        };
    }
}
