package com.cheil.cheil_be.application.commoncode.service;

import java.lang.reflect.Type;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.function.Supplier;

import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import com.google.gson.reflect.TypeToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;

import com.cheil.cheil_be.application.cache.port.out.CacheStore;
import com.cheil.cheil_be.common.cache.CacheKeys;
import com.cheil.cheil_be.config.commoncode.AppCommonCodeCacheProperties;
import com.cheil.cheil_be.domain.commoncode.CommonCode;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommonCodeCacheService {

    private static final Type COMMON_CODE_LIST_TYPE = new TypeToken<List<CommonCode>>() {
    }.getType();
    private static final Type COMMON_CODE_TYPE = new TypeToken<CommonCode>() {
    }.getType();

    private final CacheStore cacheStore;
    private final AppCommonCodeCacheProperties properties;
    @Qualifier("commonCodeCacheExecutor")
    private final TaskExecutor commonCodeCacheExecutor;
    @Qualifier("cacheGson")
    private final Gson gson;

    /**
     * 단건 공통코드를 Redis 우선으로 조회한다.
     * Redis가 느리거나 비어 있으면 DB로 내려가서 읽고, 성공 시 이후 커밋 뒤에 캐시를 채운다.
     */
    public Optional<CommonCode> getOrLoadById(Long codeId, Supplier<Optional<CommonCode>> dbLoader) {
        if (codeId == null) {
            return Optional.empty();
        }

        String cacheKey = CacheKeys.commonCodeById(codeId);
        Optional<CommonCode> cached = readCachedCommonCode(cacheKey);
        if (cached.isPresent()) {
            return cached;
        }

        Optional<CommonCode> loaded = dbLoader.get();
        loaded.ifPresent(commonCode -> cacheAfterCompletion(() -> writeCache(cacheKey, commonCode)));
        return loaded;
    }

    /**
     * level1Code 기준의 공통코드 묶음을 조회한다.
     * 1레벨 행은 level2Code가 그룹 키가 되고, 2/3레벨 행은 level1Code가 그룹 키가 된다.
     */
    public List<CommonCode> getOrLoadByLevel1Code(String level1Code, Boolean useYn, Supplier<List<CommonCode>> dbLoader) {
        String cacheKey = CacheKeys.commonCodeLevel1(level1Code, useYn);
        return readCachedCommonCodeList(cacheKey).orElseGet(() -> loadAndCache(cacheKey, dbLoader));
    }

    public List<CommonCode> getOrLoadByLevel2Code(
            String level1Code,
            String level2Code,
            Boolean useYn,
            Supplier<List<CommonCode>> dbLoader
    ) {
        String cacheKey = CacheKeys.commonCodeLevel2(level1Code, level2Code, useYn);
        return readCachedCommonCodeList(cacheKey).orElseGet(() -> loadAndCache(cacheKey, dbLoader));
    }

    /**
     * 전체 공통코드 조회용 fallback 경로.
     * 가능하면 쓰지 않고, 조건이 없는 특수 케이스에서만 사용한다.
     */
    public List<CommonCode> getOrLoadAll(Supplier<List<CommonCode>> dbLoader) {
        return dbLoader.get();
    }

    public void evictAfterCommit(CommonCode... commonCodes) {
        cacheAfterCompletion(() -> {
            if (commonCodes == null) {
                return;
            }

            for (CommonCode commonCode : commonCodes) {
                if (commonCode == null) {
                    continue;
                }
                if (commonCode.codeId() != null) {
                    evictQuietly(CacheKeys.commonCodeById(commonCode.codeId()));
                }
                scopeKeyForList(commonCode).ifPresent(this::evictAllVariantsForLevel1);
                if (commonCode.codeLevel() != null && commonCode.codeLevel() >= 2
                        && StringUtils.hasText(commonCode.level1Code())
                        && StringUtils.hasText(commonCode.level2Code())) {
                    evictAllVariantsForLevel2(commonCode.level1Code(), commonCode.level2Code());
                }
            }
        });
    }

    private Optional<CommonCode> readCachedCommonCode(String cacheKey) {
        CompletableFuture<Optional<String>> future = CompletableFuture.supplyAsync(
                () -> cacheStore.get(cacheKey),
                commonCodeCacheExecutor
        );

        try {
            Optional<String> cachedValue = future.get(properties.readTimeout().toMillis(), TimeUnit.MILLISECONDS);
            return cachedValue.flatMap(value -> deserializeCommonCode(cacheKey, value));
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            future.cancel(true);
            return Optional.empty();
        } catch (ExecutionException | TimeoutException ex) {
            future.cancel(true);
            return Optional.empty();
        }
    }

    private Optional<List<CommonCode>> readCachedCommonCodeList(String cacheKey) {
        CompletableFuture<Optional<String>> future = CompletableFuture.supplyAsync(
                () -> cacheStore.get(cacheKey),
                commonCodeCacheExecutor
        );

        try {
            Optional<String> cachedValue = future.get(properties.readTimeout().toMillis(), TimeUnit.MILLISECONDS);
            return cachedValue.flatMap(value -> deserializeCommonCodes(cacheKey, value));
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            future.cancel(true);
            return Optional.empty();
        } catch (ExecutionException | TimeoutException ex) {
            future.cancel(true);
            return Optional.empty();
        }
    }

    private List<CommonCode> loadAndCache(String cacheKey, Supplier<List<CommonCode>> dbLoader) {
        List<CommonCode> commonCodes = dbLoader.get();
        // 트랜잭션이 성공한 뒤에만 Redis에 반영한다.
        cacheAfterCompletion(() -> writeCache(cacheKey, commonCodes));
        return commonCodes;
    }

    private Optional<CommonCode> deserializeCommonCode(String cacheKey, String cachedValue) {
        try {
            return Optional.ofNullable(gson.fromJson(cachedValue, COMMON_CODE_TYPE));
        } catch (JsonSyntaxException ex) {
            log.debug("Failed to deserialize common code cache entry. Evicting cache key {}.", cacheKey, ex);
            evictQuietly(cacheKey);
            return Optional.empty();
        }
    }

    private Optional<List<CommonCode>> deserializeCommonCodes(String cacheKey, String cachedValue) {
        try {
            return Optional.ofNullable(gson.fromJson(cachedValue, COMMON_CODE_LIST_TYPE));
        } catch (JsonSyntaxException ex) {
            log.debug("Failed to deserialize common code cache entry. Evicting cache key {}.", cacheKey, ex);
            evictQuietly(cacheKey);
            return Optional.empty();
        }
    }

    private void writeCache(String cacheKey, List<CommonCode> commonCodes) {
        try {
            cacheStore.put(cacheKey, gson.toJson(commonCodes), properties.ttl());
        } catch (RuntimeException ex) {
            log.debug("Failed to serialize common codes for cache.", ex);
        }
    }

    private void writeCache(String cacheKey, CommonCode commonCode) {
        try {
            cacheStore.put(cacheKey, gson.toJson(commonCode), properties.ttl());
        } catch (RuntimeException ex) {
            log.debug("Failed to serialize common code for cache.", ex);
        }
    }

    private void evictQuietly(String cacheKey) {
        try {
            cacheStore.evict(cacheKey);
        } catch (RuntimeException ex) {
            log.debug("Failed to evict common code cache key {}.", cacheKey, ex);
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
        // level1Code 기준 캐시도 useYn별로 모두 제거한다.
        evictQuietly(CacheKeys.commonCodeLevel1(level1Code));
        evictQuietly(CacheKeys.commonCodeLevel1(level1Code, Boolean.TRUE));
        evictQuietly(CacheKeys.commonCodeLevel1(level1Code, Boolean.FALSE));
    }

    private void evictAllVariantsForLevel2(String level1Code, String level2Code) {
        evictQuietly(CacheKeys.commonCodeLevel2(level1Code, level2Code));
        evictQuietly(CacheKeys.commonCodeLevel2(level1Code, level2Code, Boolean.TRUE));
        evictQuietly(CacheKeys.commonCodeLevel2(level1Code, level2Code, Boolean.FALSE));
    }

    private void cacheAfterCompletion(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
            return;
        }

        action.run();
    }
}
