package com.cheil.cheil_be.common.cache;

import java.util.Locale;
import java.util.regex.Pattern;

import lombok.experimental.UtilityClass;
import org.springframework.util.StringUtils;

/**
 * 캐시 키를 서비스 전반에서 일관된 형식으로 만들기 위한 공통 유틸입니다.
 * <p>
 * 외부 입력값을 그대로 키로 쓰지 않고 정규화해서,
 * Valkey 키 형식이 흔들리거나 예기치 않은 문자가 들어가는 일을 막습니다.
 */
@UtilityClass
public class CacheKeys {

    private static final Pattern UNSAFE_KEY_CHARS = Pattern.compile("[^a-z0-9:_-]");

    public String frequentApi(String serviceId, String apiName, String fingerprint) {
        return "cache:api:%s:%s:%s".formatted(normalize(serviceId), normalize(apiName), normalize(fingerprint));
    }

    public String systemNotices() {
        return "cache:system:notices";
    }

    public String systemPolicy(String policyKey) {
        return "cache:system:policies:%s".formatted(normalize(policyKey));
    }

    public String commonCodeById(Long codeId) {
        if (codeId == null) {
            throw new IllegalArgumentException("codeId must not be null");
        }
        return "cache:common-codes:by-id:%s".formatted(codeId);
    }

    public String commonCodeLevel1(String level1Code) {
        if (!StringUtils.hasText(level1Code)) {
            throw new IllegalArgumentException("level1Code must not be blank");
        }
        return "cache:common-codes:level1:%s".formatted(normalize(level1Code));
    }

    public String commonCodeLevel2(String level1Code, String level2Code) {
        if (!StringUtils.hasText(level1Code)) {
            throw new IllegalArgumentException("level1Code must not be blank");
        }
        if (!StringUtils.hasText(level2Code)) {
            throw new IllegalArgumentException("level2Code must not be blank");
        }
        return "cache:common-codes:level1:%s:level2:%s"
                .formatted(normalize(level1Code), normalize(level2Code));
    }

    private static String normalize(String value) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException("cache key segment must not be blank");
        }
        return UNSAFE_KEY_CHARS.matcher(value.trim().toLowerCase(Locale.ROOT)).replaceAll("-");
    }

}
