package com.pfe.enums;

public enum MilestoneStatus {
    PENDING,
    IN_PROGRESS,
    COMPLETED;
    
    @com.fasterxml.jackson.annotation.JsonCreator
    public static MilestoneStatus fromString(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        try {
            return MilestoneStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
