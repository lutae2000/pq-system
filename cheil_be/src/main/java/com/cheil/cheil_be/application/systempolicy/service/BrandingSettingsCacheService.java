package com.cheil.cheil_be.application.systempolicy.service;

import java.util.function.Supplier;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class BrandingSettingsCacheService {

    @Cacheable(
            cacheNames = "brandingSettings",
            key = "T(com.cheil.cheil_be.common.cache.CacheKeys).brandingSettings()"
    )
    public BrandingAssetService.BrandingSettings getOrLoad(
            Supplier<BrandingAssetService.BrandingSettings> dbLoader
    ) {
        return dbLoader.get();
    }

    @CacheEvict(
            cacheNames = "brandingSettings",
            key = "T(com.cheil.cheil_be.common.cache.CacheKeys).brandingSettings()"
    )
    public void evict() {
    }
}
