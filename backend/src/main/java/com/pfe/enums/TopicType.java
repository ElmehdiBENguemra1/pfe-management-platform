package com.pfe.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum TopicType {
    PFE,
    INTERNSHIP;

    @JsonCreator
    public static TopicType fromString(String value) {
        if (value == null) return null;
        return TopicType.valueOf(value.toUpperCase());
    }
}
