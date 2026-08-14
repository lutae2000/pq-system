package com.cheil.cheil_be.common.logging;

import java.util.regex.Pattern;

import lombok.experimental.UtilityClass;

/**
 * 로그나 감사 기록에 남기기 전에 민감한 값을 마스킹하는 공통 유틸입니다.
 * <p>
 * 비밀번호, 토큰, API 키, 인증 헤더처럼 그대로 저장하면 안 되는 문자열을 찾아 `***`로 치환합니다.
 */
@UtilityClass
public class SensitiveValueMasker {

    private static final Pattern SENSITIVE_JSON_FIELD = Pattern.compile(
            "(?i)(\"[^\"]*(?:password|api[_-]?key|access[_-]?token|refresh[_-]?token|id[_-]?token|secret|authorization)[^\"]*\"\\s*:\\s*\")([^\"]*)(\")"
    );

    public String mask(String value) {
        if (value == null) {
            return null;
        }
        return SENSITIVE_JSON_FIELD.matcher(value).replaceAll("$1***$3");
    }
}
