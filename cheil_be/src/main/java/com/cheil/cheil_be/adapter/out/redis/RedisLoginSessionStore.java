package com.cheil.cheil_be.adapter.out.redis;

import java.time.Duration;
import java.util.UUID;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import com.cheil.cheil_be.application.cache.port.out.CacheStore;
import com.cheil.cheil_be.application.userauth.port.out.LoginSessionStore;

@Repository
@RequiredArgsConstructor
public class RedisLoginSessionStore implements LoginSessionStore {

    private static final String KEY_PREFIX = "login:session:current:";

    private final CacheStore cacheStore;

    @Override
    public String issue(String loginId, Duration ttl) {
        requireText(loginId, "loginId");
        if (ttl == null || ttl.isZero() || ttl.isNegative()) {
            throw new IllegalArgumentException("ttl must be positive");
        }

        String sessionId = UUID.randomUUID().toString();
        cacheStore.put(key(loginId), sessionId, ttl);
        return sessionId;
    }

    @Override
    public Optional<String> currentSessionId(String loginId) {
        requireText(loginId, "loginId");
        return cacheStore.get(key(loginId));
    }

    @Override
    public boolean isCurrent(String loginId, String sessionId) {
        requireText(loginId, "loginId");
        requireText(sessionId, "sessionId");
        return cacheStore.get(key(loginId)).filter(sessionId::equals).isPresent();
    }

    @Override
    public void revoke(String loginId) {
        requireText(loginId, "loginId");
        cacheStore.evict(key(loginId));
    }

    private static String key(String loginId) {
        return KEY_PREFIX + loginId;
    }

    private static void requireText(String value, String name) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException(name + " must not be blank");
        }
    }
}
