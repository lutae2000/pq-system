package com.cheil.cheil_be.application.cache.port.out;

import java.time.Duration;
import java.util.Optional;

public interface CacheStore {

    Optional<String> get(String key);

    void put(String key, String value, Duration ttl);

    boolean evict(String key);
}
