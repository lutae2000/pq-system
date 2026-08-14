package com.cheil.cheil_be.adapter.out.security;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import com.cheil.cheil_be.application.auth.port.out.TokenProvider;
import com.cheil.cheil_be.config.security.AppSecurityProperties;
import com.cheil.cheil_be.domain.auth.IssuedToken;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

/**
 * 별도 JWT 라이브러리 없이 JDK HMAC 기능으로 내부 통신용 JWT를 생성합니다.
 */
@Component
@RequiredArgsConstructor
public class JdkJwtTokenProvider implements TokenProvider {

    private static final String TOKEN_TYPE = "Bearer";
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final AppSecurityProperties securityProperties;
    private final ObjectMapper objectMapper;
    private final Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();

    @Override
    public IssuedToken issue(String issuer, String serviceId, Set<String> scopes, Instant issuedAt, Instant expiresAt) {
        String header = encodeJson(Map.of("alg", "HS256", "typ", "JWT"));
        String payload = encodeJson(payload(issuer, serviceId, scopes, issuedAt, expiresAt));
        String unsignedToken = "%s.%s".formatted(header, payload);
        String token = "%s.%s".formatted(unsignedToken, sign(unsignedToken));
        return new IssuedToken(
                token,
                TOKEN_TYPE,
                Duration.between(issuedAt, expiresAt).toSeconds(),
                expiresAt,
                serviceId
        );
    }

    private Map<String, Object> payload(
            String issuer,
            String serviceId,
            Set<String> scopes,
            Instant issuedAt,
            Instant expiresAt
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("iss", issuer);
        payload.put("sub", serviceId);
        payload.put("iat", issuedAt.getEpochSecond());
        payload.put("exp", expiresAt.getEpochSecond());
        payload.put("scope", scopes == null ? Set.of() : new TreeSet<>(scopes));
        return payload;
    }

    private String encodeJson(Object value) {
        try {
            return encoder.encodeToString(objectMapper.writeValueAsBytes(value));
        } catch (JacksonException ex) {
            throw new IllegalStateException("Failed to serialize token payload", ex);
        }
    }

    private String sign(String unsignedToken) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(
                    securityProperties.token().secret().getBytes(StandardCharsets.UTF_8),
                    HMAC_ALGORITHM
            ));
            return encoder.encodeToString(mac.doFinal(unsignedToken.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to sign token", ex);
        }
    }
}
