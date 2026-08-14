package com.cheil.cheil_be.application.educationreminder.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

final class EducationReminderDateUtils {

    private static final DateTimeFormatter STORAGE_DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;
    private static final DateTimeFormatter RESPONSE_DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    private EducationReminderDateUtils() {
    }

    static String normalizeDateForStorage(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }

        String normalized = value.trim().replace("-", "");
        try {
            LocalDate.parse(normalized, STORAGE_DATE_FORMATTER);
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date format.");
        }
        return normalized;
    }

    static String normalizeDateForResponse(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }

        String normalized = value.trim().replace("-", "");
        try {
            return LocalDate.parse(normalized, STORAGE_DATE_FORMATTER).format(RESPONSE_DATE_FORMATTER);
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date format.");
        }
    }

    static String normalizeOptionalDateFilter(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        String normalized = value.trim().replace("-", "");
        if (normalized.length() == 4) {
            if (!normalized.chars().allMatch(Character::isDigit)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date format.");
            }
            return normalized;
        }

        return normalizeDateForStorage(normalized);
    }

    static void appendDateFilterCondition(
            StringBuilder outerWhere,
            Map<String, Object> params,
            String columnName,
            String paramName,
            String normalizedDateFilter
    ) {
        if (normalizedDateFilter.length() == 4) {
            outerWhere.append("\n                  AND COALESCE(")
                    .append(columnName)
                    .append(", '') LIKE :")
                    .append(paramName);
            params.put(paramName, normalizedDateFilter + "%");
            return;
        }

        outerWhere.append("\n                  AND COALESCE(")
                .append(columnName)
                .append(", '') = :")
                .append(paramName);
        params.put(paramName, normalizedDateFilter);
    }

    static String addCycle(String value, String cycleUnit, int cycleValue) {
        LocalDate date = parseResponseDate(value);
        if (date == null) {
            return "";
        }

        if ("MONTH".equalsIgnoreCase(cycleUnit)) {
            return date.plusMonths(cycleValue).format(RESPONSE_DATE_FORMATTER);
        }
        return date.plusYears(cycleValue).format(RESPONSE_DATE_FORMATTER);
    }

    static LocalDate parseResponseDate(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return LocalDate.parse(value, RESPONSE_DATE_FORMATTER);
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date format.");
        }
    }
}
