package com.cheil.cheil_be.common.security;

import java.util.Optional;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;

/**
 * 서비스 인증의 주체를 나타내는 값 객체입니다.
 * <p>
 * 현재 SecurityContext에서 서비스 ID를 읽어와 감사 로그나 권한 체크에 재사용합니다.
 */
public record ServicePrincipal(String serviceId) {

    public static final String SERVER_SERVICE_ID = "server";

    public ServicePrincipal {
        if (!StringUtils.hasText(serviceId)) {
            throw new IllegalArgumentException("serviceId must not be blank");
        }
    }

    public static Optional<String> currentServiceId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof ServicePrincipal principal)) {
            return Optional.empty();
        }
        return Optional.of(principal.serviceId());
    }
}
