package com.cheil.cheil_be.application.engineer;

final class EngineerEntityUtils {
    private EngineerEntityUtils() {
    }

    static String clean(String value) {
        return value == null || value.trim().isBlank() ? null : value.trim();
    }

    static String date(String value) {
        String text = clean(value);
        return text != null && text.matches("\\d{4}-\\d{2}-\\d{2}") ? text.replace("-", "") : text;
    }

    static String yn(String value) {
        String text = clean(value);
        return "Y".equalsIgnoreCase(text) || "TRUE".equalsIgnoreCase(text) ? "Y" : "N";
    }
}
