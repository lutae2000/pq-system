package com.cheil.cheil_be.common.cache;

import java.util.Locale;
import java.util.regex.Pattern;

import lombok.experimental.UtilityClass;
import org.springframework.util.StringUtils;

@UtilityClass
public class DepartmentCacheKeys {

    private static final Pattern UNSAFE_KEY_CHARS = Pattern.compile("[^a-z0-9:_-]");

    public String departments() {
        return "cache:departments";
    }

    public String departmentByCode(String deptCode) {
        if (!StringUtils.hasText(deptCode)) {
            throw new IllegalArgumentException("deptCode must not be blank");
        }
        return "cache:departments:by-code:%s".formatted(normalize(deptCode));
    }

    private static String normalize(String value) {
        return UNSAFE_KEY_CHARS.matcher(value.trim().toLowerCase(Locale.ROOT)).replaceAll("-");
    }
}
