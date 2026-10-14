package com.muthu.CampusDocus.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum DocumentCategory {
    ACADEMIC_RECORDS("Academic Records"),
    CERTIFICATES("Certificates"),
    IDENTIFICATION_DOCUMENTS("Identification Documents"),
    PERSONAL_DOCUMENTS("Personal Documents"),
    OTHER("Other");

    private final String displayName;

    DocumentCategory(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static DocumentCategory fromString(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        String trimmed = text.trim();
        String normalized = trimmed.replace(" ", "_").replace("-", "_");
        for (DocumentCategory category : DocumentCategory.values()) {
            if (category.displayName.equalsIgnoreCase(trimmed)
                    || category.name().equalsIgnoreCase(trimmed)
                    || category.name().equalsIgnoreCase(normalized)) {
                return category;
            }
        }
        return null;
    }
}
