package com.cheil.cheil_be.application.common.validation;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.regex.Pattern;

import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.common.text.StringValues;

/** 애플리케이션 입력값의 정규화와 공통 검증 정책을 제공합니다. */
public final class InputValues {

    private static final DateTimeFormatter BASIC_DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;
    private static final Pattern BASIC_DATE_PATTERN = Pattern.compile("(?:\\d{8}|\\d{4}-\\d{2}-\\d{2})");
    private static final Pattern YEAR_MONTH_PATTERN = Pattern.compile("(?:\\d{6}|\\d{4}-\\d{2})");

    private InputValues() {
    }

    public static <T> T requireNonNull(T value, String errorMessage) {
        if (value == null) {
            throw ApplicationException.badRequest(errorMessage);
        }
        return value;
    }

    public static String requiredText(String value, String fieldName) {
        return requireText(value, fieldName + "은(는) 필수입니다.");
    }

    public static String requireText(String value, String errorMessage) {
        String normalized = StringValues.trimToNull(value);
        if (normalized == null) {
            throw ApplicationException.badRequest(errorMessage);
        }
        return normalized;
    }

    public static String requiredText(String value, int maxLength, String fieldName) {
        String normalized = requiredText(value, fieldName);
        validateMaxLength(normalized, maxLength, fieldName);
        return normalized;
    }

    public static String optionalText(String value, int maxLength, String fieldName) {
        String normalized = StringValues.trimToNull(value);
        validateMaxLength(normalized, maxLength, fieldName);
        return normalized;
    }

    public static String digits(String value, int maxLength, String fieldName) {
        String normalized = StringValues.digitsOnly(value);
        validateMaxLength(normalized, maxLength, fieldName);
        return normalized;
    }

    public static Integer integerRange(Integer value, int minimum, int maximum, String fieldName) {
        if (minimum > maximum) {
            throw new IllegalArgumentException("minimum은 maximum보다 클 수 없습니다.");
        }
        if (value != null && (value < minimum || value > maximum)) {
            throw ApplicationException.badRequest(
                    fieldName + "은(는) " + minimum + "부터 " + maximum + " 사이여야 합니다."
            );
        }
        return value;
    }

    public static String isoDate(String value, String fieldName, boolean required) {
        String basicDate = basicDate(value, fieldName, required);
        if (basicDate == null) {
            return null;
        }
        return LocalDate.parse(basicDate, BASIC_DATE_FORMATTER).toString();
    }

    public static void validateMaxLength(String value, int maxLength, String fieldName) {
        if (maxLength < 0) {
            throw new IllegalArgumentException("maxLength는 0 이상이어야 합니다.");
        }
        if (value != null && value.length() > maxLength) {
            throw ApplicationException.badRequest(
                    fieldName + "은(는) " + maxLength + "자 이하로 입력해야 합니다."
            );
        }
    }

    public static Long requiredPositive(Long value, String fieldName) {
        if (value == null || value <= 0) {
            throw ApplicationException.badRequest(fieldName + "은(는) 1 이상이어야 합니다.");
        }
        return value;
    }

    public static Integer requiredPositive(Integer value, String fieldName) {
        if (value == null || value <= 0) {
            throw ApplicationException.badRequest(fieldName + "은(는) 1 이상이어야 합니다.");
        }
        return value;
    }

    public static Integer nonNegative(Integer value, String fieldName) {
        if (value != null && value < 0) {
            throw ApplicationException.badRequest(fieldName + "은(는) 0 이상이어야 합니다.");
        }
        return value;
    }

    public static BigDecimal nonNegative(BigDecimal value, String fieldName) {
        if (value != null && value.signum() < 0) {
            throw ApplicationException.badRequest(fieldName + "은(는) 0 이상이어야 합니다.");
        }
        return value;
    }

    public static String basicDate(String value, String fieldName, boolean required) {
        String normalized = StringValues.trimToNull(value);
        if (normalized == null) {
            if (required) {
                throw ApplicationException.badRequest(fieldName + "은(는) 필수입니다.");
            }
            return null;
        }

        if (!BASIC_DATE_PATTERN.matcher(normalized).matches()) {
            throw invalidBasicDate(fieldName, null);
        }
        String compact = normalized.replace("-", "");
        try {
            LocalDate.parse(compact, BASIC_DATE_FORMATTER);
            return compact;
        } catch (DateTimeParseException exception) {
            throw invalidBasicDate(fieldName, exception);
        }
    }

    public static String yearMonth(String value, String fieldName, boolean required) {
        String normalized = StringValues.trimToNull(value);
        if (normalized == null) {
            if (required) {
                throw ApplicationException.badRequest(fieldName + "은(는) 필수입니다.");
            }
            return null;
        }
        if (!YEAR_MONTH_PATTERN.matcher(normalized).matches()) {
            throw ApplicationException.badRequest(fieldName + "은(는) YYYYMM 형식의 유효한 연월이어야 합니다.");
        }
        String compact = normalized.replace("-", "");
        try {
            LocalDate.parse(compact + "01", BASIC_DATE_FORMATTER);
            return compact;
        } catch (DateTimeParseException exception) {
            throw ApplicationException.badRequest(
                    fieldName + "은(는) YYYYMM 형식의 유효한 연월이어야 합니다.", exception
            );
        }
    }

    private static ApplicationException invalidBasicDate(String fieldName, Throwable cause) {
        String message = fieldName + "은(는) YYYYMMDD 형식의 유효한 날짜여야 합니다.";
        return cause == null
                ? ApplicationException.badRequest(message)
                : ApplicationException.badRequest(message, cause);
    }
}
