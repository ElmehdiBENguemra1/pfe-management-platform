package com.pfe.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum TopicType {
    PFE,
    INTERNSHIP;

    @JsonCreator
    public static TopicType fromString(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        try {
            return TopicType.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
