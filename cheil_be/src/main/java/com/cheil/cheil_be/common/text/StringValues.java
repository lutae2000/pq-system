package com.cheil.cheil_be.common.text;

import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

/**
 * String 입력값을 서비스 레이어에서 공통으로 다루기 위한 헬퍼입니다.
 * <p>
 * 요청값의 공백 처리, 필수값 검증, 선택값 기본치 적용, 길이 검증, 검색용 대소문자 무시 비교를
 * 한 곳으로 모아 두면 각 서비스가 같은 규칙을 반복 구현하지 않아도 됩니다.
 */
public final class StringValues {

    private StringValues() {
    }

    public static String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim() : "";
    }

    /**
     * 필수 입력값을 검증하고, 앞뒤 공백을 제거한 값을 반환합니다.
     */
    public static String required(String value, String fieldName) {
        if (!StringUtils.hasText(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + "은(는) 필수입니다.");
        }
        return value.trim();
    }

    /**
     * 값이 없으면 fallback을 쓰고, 있으면 공백을 제거한 값을 반환합니다.
     */
    public static String optional(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }

    /**
     * 검색어나 비교값처럼 대소문자 차이를 무시하고 포함 여부를 확인합니다.
     */
    public static boolean containsIgnoreCase(String value, String keyword) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(normalize(keyword).toLowerCase(Locale.ROOT));
    }

    /**
     * 문자열 길이가 DB 컬럼 제한을 넘지 않는지 확인합니다.
     */
    public static void validateMaxLength(String value, int maxLength, String fieldName) {
        if (value != null && value.length() > maxLength) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    fieldName + "은(는) " + maxLength + "자 이하로 입력해야 합니다."
            );
        }
    }
}
