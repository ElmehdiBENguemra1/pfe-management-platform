package com.pfe.enums;

public enum ApplicationStatus {
    PENDING,
    IN_REVIEW,
    ACCEPTED,
    REJECTED,
    CANCELLED;
    
    @com.fasterxml.jackson.annotation.JsonCreator
    public static ApplicationStatus fromString(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        try {
            return ApplicationStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
