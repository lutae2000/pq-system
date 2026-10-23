package com.cheil.cheil_be.adapter.out.valkey;

import static org.springframework.util.Assert.hasText;

import java.time.Duration;
import java.util.UUID;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import com.cheil.cheil_be.application.cache.port.out.CacheStore;
import com.cheil.cheil_be.application.userauth.port.out.LoginSessionStore;

@Repository
@RequiredArgsConstructor
public class ValkeyLoginSessionStore implements LoginSessionStore {

    private static final String KEY_PREFIX = "login:session:current:";

    private final CacheStore cacheStore;

    @Override
    public String issue(String loginId, Duration ttl) {
        hasText(loginId, "loginId must not be blank");
        if (ttl == null || ttl.isZero() || ttl.isNegative()) {
            throw new IllegalArgumentException("ttl must be positive");
        }

        String sessionId = UUID.randomUUID().toString();
        cacheStore.put(key(loginId), sessionId, ttl);
        return sessionId;
    }

    @Override
    public Optional<String> currentSessionId(String loginId) {
        hasText(loginId, "loginId must not be blank");
        return cacheStore.get(key(loginId));
    }

    @Override
    public boolean isCurrent(String loginId, String sessionId) {
        hasText(loginId, "loginId must not be blank");
        hasText(sessionId, "sessionId must not be blank");
        return cacheStore.get(key(loginId)).filter(sessionId::equals).isPresent();
    }

    @Override
    public void revoke(String loginId) {
        hasText(loginId, "loginId must not be blank");
        cacheStore.evict(key(loginId));
    }

    private static String key(String loginId) {
        return KEY_PREFIX + loginId;
    }

}
