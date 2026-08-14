package com.cheil.cheil_be.adapter.out.redis;

import java.time.Duration;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import com.cheil.cheil_be.application.cache.port.out.CacheStore;

/**
 * 자주 사용하는 API 응답을 Redis에 저장하기 위한 공통 캐시 어댑터입니다.
 */
@Repository
@RequiredArgsConstructor
public class RedisCacheStore implements CacheStore {

    private final StringRedisTemplate redisTemplate;

    @Override
    public Optional<String> get(String key) {
        requireKey(key);
        return Optional.ofNullable(redisTemplate.opsForValue().get(key));
    }

    @Override
    public void put(String key, String value, Duration ttl) {
        requireKey(key);
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException("cache value must not be blank");
        }
        if (ttl == null || ttl.isZero() || ttl.isNegative()) {
            redisTemplate.opsForValue().set(key, value);
            return;
        }
        redisTemplate.opsForValue().set(key, value, ttl);
    }

    @Override
    public boolean evict(String key) {
        requireKey(key);
        return Boolean.TRUE.equals(redisTemplate.delete(key));
    }

    private static void requireKey(String key) {
        if (!StringUtils.hasText(key)) {
            throw new IllegalArgumentException("cache key must not be blank");
        }
    }
}
