package com.cheil.cheil_be.application.userauth.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.config.security.AppSecurityProperties;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
public class LoginAccessTokenService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final String TOKEN_TYPE = "Bearer";

    private final AppSecurityProperties securityProperties;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();
    private final Base64.Decoder decoder = Base64.getUrlDecoder();

    public LoginAccessToken issue(String loginId, String sessionId, Instant expiresAt) {
        Instant issuedAt = Instant.now(clock);
        String header = encodeJson(Map.of("alg", "HS256", "typ", "JWT"));
        String payload = encodeJson(payload(loginId, sessionId, issuedAt, expiresAt));
        String unsignedToken = "%s.%s".formatted(header, payload);
        String token = "%s.%s".formatted(unsignedToken, sign(unsignedToken));
        return new LoginAccessToken(token, TOKEN_TYPE, expiresAt);
    }

    public LoginAccessTokenClaims parse(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith(TOKEN_TYPE + " ")) {
            throw unauthorized();
        }

        String token = authorizationHeader.substring((TOKEN_TYPE + " ").length()).trim();
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw unauthorized();
        }

        String unsignedToken = "%s.%s".formatted(parts[0], parts[1]);
        if (!constantTimeEquals(sign(unsignedToken), parts[2])) {
            throw unauthorized();
        }

        Map<?, ?> payload = readPayload(parts[1]);
        String loginId = stringValue(payload.get("sub"));
        String sessionId = stringValue(payload.get("sid"));
        Instant expiresAt = instantValue(payload.get("exp"));

        if (loginId == null || sessionId == null || expiresAt == null || !Instant.now(clock).isBefore(expiresAt)) {
            throw unauthorized();
        }

        return new LoginAccessTokenClaims(loginId, sessionId, expiresAt);
    }

    private Map<String, Object> payload(String loginId, String sessionId, Instant issuedAt, Instant expiresAt) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("iss", securityProperties.token().issuer());
        payload.put("sub", loginId);
        payload.put("sid", sessionId);
        payload.put("typ", "login");
        payload.put("iat", issuedAt.getEpochSecond());
        payload.put("exp", expiresAt.getEpochSecond());
        return payload;
    }

    private String encodeJson(Object value) {
        try {
            return encoder.encodeToString(objectMapper.writeValueAsBytes(value));
        } catch (JacksonException ex) {
            throw new IllegalStateException("Failed to serialize login token payload", ex);
        }
    }

    private Map<?, ?> readPayload(String encodedPayload) {
        try {
            return objectMapper.readValue(decoder.decode(encodedPayload), Map.class);
        } catch (Exception ex) {
            throw unauthorized();
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
            throw new IllegalStateException("Failed to sign login token", ex);
        }
    }

    private static boolean constantTimeEquals(String left, String right) {
        return MessageDigest.isEqual(
                left.getBytes(StandardCharsets.UTF_8),
                right.getBytes(StandardCharsets.UTF_8)
        );
    }

    private static String stringValue(Object value) {
        return value instanceof String text && !text.isBlank() ? text : null;
    }

    private static Instant instantValue(Object value) {
        if (value instanceof Number number) {
            return Instant.ofEpochSecond(number.longValue());
        }
        return null;
    }

    private static ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 토큰이 유효하지 않습니다.");
    }

    public record LoginAccessToken(String accessToken, String tokenType, Instant expiresAt) {
    }

    public record LoginAccessTokenClaims(String loginId, String sessionId, Instant expiresAt) {
    }
}
