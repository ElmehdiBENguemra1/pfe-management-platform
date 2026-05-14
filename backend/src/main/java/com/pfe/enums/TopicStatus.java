package com.pfe.enums;

public enum TopicStatus {
    PENDING,
    APPROVED,
    REJECTED,
    ARCHIVED;
    
    @com.fasterxml.jackson.annotation.JsonCreator
    public static TopicStatus fromString(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        try {
            return TopicStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
