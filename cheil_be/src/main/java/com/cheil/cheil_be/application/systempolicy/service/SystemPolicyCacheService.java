package com.cheil.cheil_be.application.systempolicy.service;

import java.util.Optional;
import java.util.function.Supplier;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.cheil.cheil_be.application.systempolicy.model.SystemPolicy;

@Service
@RequiredArgsConstructor
public class SystemPolicyCacheService {

    @Cacheable(
            cacheNames = "systemPolicies",
            key = "T(com.cheil.cheil_be.common.cache.CacheKeys).systemPolicy(#policyKey)"
    )
    public Optional<CachedPolicy> getOrLoad(
            String policyKey,
            Supplier<Optional<SystemPolicy>> dbLoader
    ) {
        return dbLoader.get().map(policy -> new CachedPolicy(policy.useYn(), policy.policyValue()));
    }

    @CachePut(
            cacheNames = "systemPolicies",
            key = "T(com.cheil.cheil_be.common.cache.CacheKeys).systemPolicy(#policyKey)",
            condition = "#policy != null"
    )
    public CachedPolicy refresh(String policyKey, SystemPolicy policy) {
        return new CachedPolicy(policy.useYn(), policy.policyValue());
    }

    public record CachedPolicy(boolean enabled, String value) { }
}
