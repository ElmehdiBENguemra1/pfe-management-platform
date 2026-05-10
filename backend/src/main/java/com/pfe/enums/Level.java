package com.pfe.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum Level {
    L1, L2, L3,
    M1, M2,
    INGENIEUR_1, INGENIEUR_2, INGENIEUR_3,
    PREPA_1, PREPA_2,
    BTS_1, BTS_2,
    DUT_1, DUT_2,
    DOCTORAT;

    @JsonCreator
    public static Level fromString(String value) {
        if (value == null) return null;
        return Level.valueOf(value.toUpperCase());
    }
}
