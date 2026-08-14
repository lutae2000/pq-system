package com.cheil.cheil_be.common.security;

import java.util.Optional;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Resolves the current login id from the active web request.
 */
public final class CurrentLoginIdResolver {

    private CurrentLoginIdResolver() {
    }

    public static Optional<String> resolve() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (!(attributes instanceof ServletRequestAttributes servletRequestAttributes)) {
            return Optional.empty();
        }

        HttpServletRequest request = servletRequestAttributes.getRequest();
        String loginId = request.getHeader(SecurityHeaders.LOGIN_ID);
        if (!StringUtils.hasText(loginId)) {
            Object requestAttribute = request.getAttribute("loginId");
            if (requestAttribute instanceof String attributeLoginId && StringUtils.hasText(attributeLoginId)) {
                loginId = attributeLoginId;
            }
        }

        return StringUtils.hasText(loginId) ? Optional.of(loginId.trim()) : Optional.empty();
    }
}
