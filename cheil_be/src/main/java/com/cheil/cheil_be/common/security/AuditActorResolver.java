package com.cheil.cheil_be.common.security;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Resolves the actor name used for audit fields.
 */
public final class AuditActorResolver {

    private AuditActorResolver() {
    }

    public static String resolve() {
        return resolve(null);
    }

    public static String resolve(String fallback) {
        return currentLoginId()
                .or(AuditActorResolver::currentServiceId)
                .or(() -> StringUtils.hasText(fallback) ? java.util.Optional.of(fallback) : java.util.Optional.empty())
                .map(String::trim)
                .filter(StringUtils::hasText)
                .orElse("system");
    }

    private static java.util.Optional<String> currentServiceId() {
        return ServicePrincipal.currentServiceId();
    }

    private static java.util.Optional<String> currentLoginId() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (!(attributes instanceof ServletRequestAttributes servletRequestAttributes)) {
            return java.util.Optional.empty();
        }

        HttpServletRequest request = servletRequestAttributes.getRequest();
        String loginId = request.getHeader(SecurityHeaders.LOGIN_ID);
        if (!StringUtils.hasText(loginId)) {
            return java.util.Optional.empty();
        }
        return java.util.Optional.of(loginId);
    }
}
