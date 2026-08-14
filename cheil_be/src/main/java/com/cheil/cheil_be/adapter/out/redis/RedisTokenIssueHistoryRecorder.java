package com.cheil.cheil_be.adapter.out.redis;

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
import org.springframework.util.StringUtils;

import com.cheil.cheil_be.application.auth.port.out.TokenIssueHistoryRecorder;
import com.cheil.cheil_be.domain.auth.IssuedToken;

@Repository
@RequiredArgsConstructor
public class RedisTokenIssueHistoryRecorder implements TokenIssueHistoryRecorder {

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

    private final StringRedisTemplate redisTemplate;

    @Override
    public void record(String issuer, String serviceId, Set<String> scopes, IssuedToken issuedToken, Instant issuedAt) {
        requireText(issuer, "issuer");
        requireText(serviceId, "serviceId");
        requireText(issuedToken.accessToken(), "issuedToken.accessToken");
        requireText(issuedToken.tokenType(), "issuedToken.tokenType");
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

        redisTemplate.opsForHash().putAll(historyKey, record);
        redisTemplate.opsForZSet().add(serviceHistoryKey, tokenHash, issuedAt.toEpochMilli());

        if (!ttl.isZero() && !ttl.isNegative()) {
            redisTemplate.expire(historyKey, ttl);
            redisTemplate.expire(serviceHistoryKey, ttl);
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

    private static void requireText(String value, String name) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException(name + " must not be blank");
        }
    }
}
