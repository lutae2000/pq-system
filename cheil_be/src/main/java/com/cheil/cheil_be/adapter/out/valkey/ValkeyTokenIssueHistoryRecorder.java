package com.cheil.cheil_be.adapter.out.valkey;

import static org.springframework.util.Assert.hasText;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import com.cheil.cheil_be.application.auth.port.out.TokenIssueHistoryRecorder;
import com.cheil.cheil_be.domain.auth.IssuedToken;

@Repository
@RequiredArgsConstructor
public class ValkeyTokenIssueHistoryRecorder implements TokenIssueHistoryRecorder {

    private static final String HISTORY_KEY_PREFIX = "token:issue-history:";
    private static final String SERVICE_HISTORY_KEY_PREFIX = "token:issue-history:service:";
    private static final String FIELD_ISSUER = "issuer";
    private static final String FIELD_SERVICE_ID = "service_id";
    private static final String FIELD_TOKEN_HASH = "token_hash";
    private static final String FIELD_TOKEN_TYPE = "token_type";
    private static final String FIELD_EXPIRES_IN = "expires_in";
    private static final String FIELD_ISSUED_AT = "issued_at";
    private static final String FIELD_EXPIRES_AT = "expires_at";
    private static final String FIELD_SCOPES = "scopes";

    private final StringRedisTemplate valkeyTemplate;

    @Override
    public void record(String issuer, String serviceId, Set<String> scopes, IssuedToken issuedToken, Instant issuedAt) {
        hasText(issuer, "issuer must not be blank");
        hasText(serviceId, "serviceId must not be blank");
        hasText(issuedToken.accessToken(), "issuedToken.accessToken must not be blank");
        hasText(issuedToken.tokenType(), "issuedToken.tokenType must not be blank");
        if (issuedAt == null) {
            throw new IllegalArgumentException("issuedAt must not be null");
        }

        String tokenHash = hash(issuedToken.accessToken());
        String historyKey = HISTORY_KEY_PREFIX + tokenHash;
        String serviceHistoryKey = SERVICE_HISTORY_KEY_PREFIX + serviceId;
        Duration ttl = Duration.ofSeconds(issuedToken.expiresIn());

        Map<String, String> record = new LinkedHashMap<>();
        record.put(FIELD_ISSUER, issuer);
        record.put(FIELD_SERVICE_ID, serviceId);
        record.put(FIELD_TOKEN_HASH, tokenHash);
        record.put(FIELD_TOKEN_TYPE, issuedToken.tokenType());
        record.put(FIELD_EXPIRES_IN, Long.toString(issuedToken.expiresIn()));
        record.put(FIELD_ISSUED_AT, issuedAt.toString());
        record.put(FIELD_EXPIRES_AT, issuedToken.expiresAt().toString());
        record.put(FIELD_SCOPES, formatScopes(scopes));

        valkeyTemplate.opsForHash().putAll(historyKey, record);
        valkeyTemplate.opsForZSet().add(serviceHistoryKey, tokenHash, issuedAt.toEpochMilli());

        if (!ttl.isZero() && !ttl.isNegative()) {
            valkeyTemplate.expire(historyKey, ttl);
            valkeyTemplate.expire(serviceHistoryKey, ttl);
        }
    }

    private static String formatScopes(Set<String> scopes) {
        if (scopes == null || scopes.isEmpty()) {
            return "";
        }
        return String.join(",", new TreeSet<>(scopes));
    }

    private static String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Failed to hash token", ex);
        }
    }

}
