package com.cheil.cheil_be.application.systempolicy.service;

import java.lang.reflect.Type;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.function.Supplier;

import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import com.google.gson.reflect.TypeToken;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.stereotype.Service;

import com.cheil.cheil_be.adapter.out.persistence.systempolicy.SystemPolicyEntity;
import com.cheil.cheil_be.application.cache.port.out.CacheStore;
import com.cheil.cheil_be.common.cache.CacheKeys;
import com.cheil.cheil_be.config.systempolicy.AppSystemPolicyCacheProperties;

@Service
@Slf4j
public class SystemPolicyCacheService {

    private static final Type POLICY_TYPE = new TypeToken<CachedPolicy>() { }.getType();

    private final CacheStore cacheStore;
    private final AppSystemPolicyCacheProperties properties;
    private final TaskExecutor cacheExecutor;
    private final Gson gson;

    public SystemPolicyCacheService(
            CacheStore cacheStore,
            AppSystemPolicyCacheProperties properties,
            @Qualifier("commonCodeCacheExecutor") TaskExecutor cacheExecutor,
            @Qualifier("cacheGson") Gson gson
    ) {
        this.cacheStore = cacheStore;
        this.properties = properties;
        this.cacheExecutor = cacheExecutor;
        this.gson = gson;
    }

    /** Redis가 1초 안에 응답하지 않으면 DB를 사용하고, 이후 Redis를 갱신한다. */
    public Optional<CachedPolicy> getOrLoad(String policyKey, Supplier<Optional<SystemPolicyEntity>> dbLoader) {
        Optional<CachedPolicy> cached = read(policyKey);
        if (cached.isPresent()) {
            return cached.filter(CachedPolicy::enabled);
        }

        Optional<CachedPolicy> loaded = dbLoader.get().map(policy -> new CachedPolicy(policy.isUseYn(), policy.getPolicyValue()));
        loaded.ifPresent(policy -> write(policyKey, policy));
        return loaded.filter(CachedPolicy::enabled);
    }

    public void refresh(String policyKey, SystemPolicyEntity policy) {
        if (policy != null) {
            write(policyKey, new CachedPolicy(policy.isUseYn(), policy.getPolicyValue()));
        }
    }

    private Optional<CachedPolicy> read(String policyKey) {
        CompletableFuture<Optional<String>> future = CompletableFuture.supplyAsync(
                () -> cacheStore.get(CacheKeys.systemPolicy(policyKey)), cacheExecutor);
        try {
            return future.get(properties.readTimeout().toMillis(), TimeUnit.MILLISECONDS)
                    .flatMap(this::deserialize);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            future.cancel(true);
        } catch (TimeoutException | RuntimeException exception) {
            future.cancel(true);
            log.debug("System policy Redis lookup failed; falling back to DB.", exception);
        } catch (java.util.concurrent.ExecutionException exception) {
            future.cancel(true);
            log.debug("System policy Redis lookup failed; falling back to DB.", exception.getCause());
        }
        return Optional.empty();
    }

    private Optional<CachedPolicy> deserialize(String value) {
        try {
            return Optional.ofNullable(gson.fromJson(value, POLICY_TYPE));
        } catch (JsonSyntaxException exception) {
            return Optional.empty();
        }
    }

    private void write(String policyKey, CachedPolicy policy) {
        try {
            cacheStore.put(CacheKeys.systemPolicy(policyKey), gson.toJson(policy, POLICY_TYPE), properties.ttl());
        } catch (RuntimeException exception) {
            log.debug("System policy Redis write failed.", exception);
        }
    }

    public record CachedPolicy(boolean enabled, String value) { }
}
