package com.cheil.cheil_be.common.text;

/**
 * 계층에 관계없이 사용할 수 있는 순수 문자열 연산을 제공합니다.
 * <p>
 * 예외나 특정 계층에 의존하지 않는 순수 문자열 변환과 비교만 제공합니다.
 */
public final class StringValues {

    private StringValues() {
    }

    public static String normalize(String value) {
        String normalized = trimToNull(value);
        return normalized == null ? "" : normalized;
    }

    public static String emptyIfNull(String value) {
        return value == null ? "" : value;
    }

    /**
     * 선택 입력값의 앞뒤 공백을 제거하고, 값이 없으면 null을 반환합니다.
     */
    public static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    /**
     * 값이 없으면 fallback을 쓰고, 있으면 공백을 제거한 값을 반환합니다.
     */
    public static String optional(String value, String fallback) {
        String normalized = trimToNull(value);
        return normalized == null ? fallback : normalized;
    }

    /** 숫자가 아닌 문자를 제거합니다. 전화번호처럼 구분자를 허용하는 입력에 사용합니다. */
    public static String digitsOnly(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        StringBuilder digits = new StringBuilder(value.length());
        for (int index = 0; index < value.length(); index++) {
            char character = value.charAt(index);
            if (character >= '0' && character <= '9') {
                digits.append(character);
            }
        }
        return digits.toString();
    }

    /**
     * 검색어나 비교값처럼 대소문자 차이를 무시하고 포함 여부를 확인합니다.
     */
    public static boolean containsIgnoreCase(String value, String keyword) {
        String normalizedKeyword = trimToNull(keyword);
        if (value == null) {
            return false;
        }
        if (normalizedKeyword == null) {
            return true;
        }
        int lastStart = value.length() - normalizedKeyword.length();
        for (int index = 0; index <= lastStart; index++) {
            if (value.regionMatches(true, index, normalizedKeyword, 0, normalizedKeyword.length())) {
                return true;
            }
        }
        return false;
    }
}
