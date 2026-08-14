package com.cheil.cheil_be.common.web;

import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

/**
 * Request DTO normalization and validation helpers.
 */
public final class RequestValues {

    private RequestValues() {
    }

    public static String trimToEmpty(String value) {
        return StringUtils.hasText(value) ? value.trim() : "";
    }

    public static String required(String value, String fieldName) {
        String normalized = trimToEmpty(value);
        if (!StringUtils.hasText(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + "은(는) 필수입니다.");
        }
        return normalized;
    }

    public static String maxLength(String value, int maxLength, String fieldName) {
        String normalized = trimToEmpty(value);
        if (normalized.length() > maxLength) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    fieldName + "은(는) " + maxLength + "자 이하로 입력해야 합니다."
            );
        }
        return normalized;
    }

    public static String requiredMaxLength(String value, int maxLength, String fieldName) {
        return maxLength(required(value, fieldName), maxLength, fieldName);
    }

    public static String upperCode(String value, String fieldName) {
        return required(value, fieldName).toUpperCase(Locale.ROOT);
    }
}
