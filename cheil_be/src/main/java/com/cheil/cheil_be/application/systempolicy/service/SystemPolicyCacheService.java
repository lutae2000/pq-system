package com.cheil.cheil_be.application.systempolicy.service;

import java.util.Optional;
import java.util.function.Supplier;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.cheil.cheil_be.adapter.out.persistence.systempolicy.SystemPolicyEntity;

@Service
@RequiredArgsConstructor
public class SystemPolicyCacheService {

    @Cacheable(
            cacheNames = "systemPolicies",
            key = "T(com.cheil.cheil_be.common.cache.CacheKeys).systemPolicy(#policyKey)"
    )
    public Optional<CachedPolicy> getOrLoad(
            String policyKey,
            Supplier<Optional<SystemPolicyEntity>> dbLoader
    ) {
        return dbLoader.get().map(policy -> new CachedPolicy(policy.isUseYn(), policy.getPolicyValue()));
    }

    @CachePut(
            cacheNames = "systemPolicies",
            key = "T(com.cheil.cheil_be.common.cache.CacheKeys).systemPolicy(#policyKey)",
            condition = "#policy != null"
    )
    public CachedPolicy refresh(String policyKey, SystemPolicyEntity policy) {
        return new CachedPolicy(policy.isUseYn(), policy.getPolicyValue());
    }

    public record CachedPolicy(boolean enabled, String value) { }
}
