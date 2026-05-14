package com.pfe.enums;

public enum Role {
    ADMIN,
    STUDENT,
    SUPERVISOR,
    COMPANY;
    
    @com.fasterxml.jackson.annotation.JsonCreator
    public static Role fromString(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        try {
            return Role.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
