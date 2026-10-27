package com.cheil.cheil_be.application.systempolicy.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.function.Supplier;

import org.junit.jupiter.api.Test;

import com.cheil.cheil_be.application.systempolicy.model.SystemPolicy;
import com.cheil.cheil_be.application.systempolicy.port.in.SystemPolicyAdminUseCase;
import com.cheil.cheil_be.common.file.FileStorageService;

class BrandingAssetServiceTest {

    private final SystemPolicyAdminUseCase policies = mock(SystemPolicyAdminUseCase.class);
    private final BrandingSettingsCacheService cache = mock(BrandingSettingsCacheService.class);
    private final BrandingAssetService service = new BrandingAssetService(mock(FileStorageService.class), policies, cache);

    @Test
    void loadsThreeBrandingPoliciesOnlyWhenCacheMisses() {
        BrandingAssetService.BrandingSettings cached = new BrandingAssetService.BrandingSettings(
                "/cached/background.png", "/cached/logo.png", "/cached/favicon.png"
        );
        when(cache.getOrLoad(any())).thenReturn(cached);

        assertThat(service.findSettings()).isEqualTo(cached);
        verify(cache).getOrLoad(any());
        org.mockito.Mockito.verifyNoInteractions(policies);
    }

    @Test
    void usesDatabaseValuesAndDefaultsOnCacheMiss() {
        when(cache.getOrLoad(any())).thenAnswer(invocation -> {
            Supplier<BrandingAssetService.BrandingSettings> loader = invocation.getArgument(0);
            return loader.get();
        });
        when(policies.findEnabledPolicy("BRANDING_COMPANY_LOGO_URL"))
                .thenReturn(Optional.of(new SystemPolicy(
                        "BRANDING_COMPANY_LOGO_URL", "Logo", "/custom/logo.png", "TEXT", 1, true, null
                )));

        assertThat(service.findSettings()).isEqualTo(new BrandingAssetService.BrandingSettings(
                BrandingAssetService.DEFAULT_LOGIN_BACKGROUND_URL,
                "/custom/logo.png",
                BrandingAssetService.DEFAULT_FAVICON_URL
        ));
    }
}
