package com.cheil.cheil_be.application.commoncode.service;

import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.cheil.cheil_be.common.cache.CacheKeys;
import com.cheil.cheil_be.domain.commoncode.CommonCode;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommonCodeCacheService {

    private static final String BY_ID_CACHE = "commonCodeById";
    private static final String LEVEL1_CACHE = "commonCodeLevel1";
    private static final String LEVEL2_CACHE = "commonCodeLevel2";

    private final CacheManager cacheManager;

    @Cacheable(
            cacheNames = BY_ID_CACHE,
            key = "T(com.cheil.cheil_be.common.cache.CacheKeys).commonCodeById(#codeId)",
            condition = "#codeId != null"
    )
    public Optional<CommonCode> getOrLoadById(Long codeId, Supplier<Optional<CommonCode>> dbLoader) {
        if (codeId == null) {
            return Optional.empty();
        }
        return dbLoader.get();
    }

    @Cacheable(
            cacheNames = LEVEL1_CACHE,
            key = "T(com.cheil.cheil_be.common.cache.CacheKeys).commonCodeLevel1(#level1Code)"
    )
    public CachedCommonCodes getOrLoadByLevel1Code(
            String level1Code,
            Supplier<List<CommonCode>> dbLoader
    ) {
        return new CachedCommonCodes(dbLoader.get());
    }

    @Cacheable(
            cacheNames = LEVEL2_CACHE,
            key = "T(com.cheil.cheil_be.common.cache.CacheKeys).commonCodeLevel2(#level1Code, #level2Code)"
    )
    public CachedCommonCodes getOrLoadByLevel2Code(
            String level1Code,
            String level2Code,
            Supplier<List<CommonCode>> dbLoader
    ) {
        return new CachedCommonCodes(dbLoader.get());
    }

    public List<CommonCode> getOrLoadAll(Supplier<List<CommonCode>> dbLoader) {
        return dbLoader.get();
    }

    public void evictAfterCommit(CommonCode... commonCodes) {
        if (commonCodes == null) {
            return;
        }

        for (CommonCode commonCode : commonCodes) {
            if (commonCode == null) {
                continue;
            }
            if (commonCode.codeId() != null) {
                evictQuietly(BY_ID_CACHE, CacheKeys.commonCodeById(commonCode.codeId()));
            }
            scopeKeyForList(commonCode).ifPresent(this::evictAllVariantsForLevel1);
            if (commonCode.codeLevel() != null && commonCode.codeLevel() >= 2
                    && commonCode.level1Code() != null && !commonCode.level1Code().isBlank()
                    && commonCode.level2Code() != null && !commonCode.level2Code().isBlank()) {
                evictAllVariantsForLevel2(commonCode.level1Code(), commonCode.level2Code());
            }
        }
    }

    private Optional<String> scopeKeyForList(CommonCode commonCode) {
        String scopeKey = commonCode.codeLevel() != null && commonCode.codeLevel() == 1
                ? commonCode.level2Code()
                : commonCode.level1Code();
        if (scopeKey == null || scopeKey.isBlank()) {
            return Optional.empty();
        }
        return Optional.of(scopeKey);
    }

    private void evictAllVariantsForLevel1(String level1Code) {
        evictQuietly(LEVEL1_CACHE, CacheKeys.commonCodeLevel1(level1Code));
    }

    private void evictAllVariantsForLevel2(String level1Code, String level2Code) {
        evictQuietly(LEVEL2_CACHE, CacheKeys.commonCodeLevel2(level1Code, level2Code));
    }

    private void evictQuietly(String cacheName, String key) {
        try {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.evict(key);
            }
        } catch (RuntimeException ex) {
            log.debug("Failed to evict common code cache. cache={}, key={}", cacheName, key, ex);
        }
    }

    public record CachedCommonCodes(List<CommonCode> items) {

        public CachedCommonCodes {
            items = items == null ? List.of() : List.copyOf(items);
        }
    }
}
