package com.cheil.cheil_be.config.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 설정 파일에 등록된 연동 서비스별 service-id/api-key 조합을 검증합니다.
 */
@Component
@RequiredArgsConstructor
public class ServiceCredentialRegistry {

    private final AppSecurityProperties securityProperties;

    public Optional<AppSecurityProperties.Integration> authenticate(String serviceId, String apiKey) {
        if (!StringUtils.hasText(serviceId) || !StringUtils.hasText(apiKey)) {
            return Optional.empty();
        }

        return securityProperties.integrations().values().stream()
                .filter(integration -> serviceId.equals(integration.serviceId()))
                .filter(integration -> constantTimeEquals(apiKey, integration.apiKey()))
                .findFirst();
    }

    private static boolean constantTimeEquals(String actual, String expected) {
        if (!StringUtils.hasText(actual) || !StringUtils.hasText(expected)) {
            return false;
        }
        return MessageDigest.isEqual(
                actual.getBytes(StandardCharsets.UTF_8),
                expected.getBytes(StandardCharsets.UTF_8)
        );
    }
}
