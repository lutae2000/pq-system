package com.cheil.cheil_be.application.systempolicy.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import com.cheil.cheil_be.application.systempolicy.model.SystemPolicy;
import com.cheil.cheil_be.application.systempolicy.port.out.SystemPolicyRepository;

class SystemPolicyAdminServiceTest {

    private final SystemPolicyRepository repository = mock(SystemPolicyRepository.class);
    private final SystemPolicyCacheService cacheService = mock(SystemPolicyCacheService.class);
    private final BrandingSettingsCacheService brandingCacheService = mock(BrandingSettingsCacheService.class);
    private final SystemPolicyAdminService service = new SystemPolicyAdminService(repository, cacheService, brandingCacheService);

    @Test
    void createPolicyNormalizesAndRefreshesCache() {
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        SystemPolicy saved = service.createPolicy(new SystemPolicy(
                " LOGIN_LIMIT ", " 로그인 제한 ", "3", " NUMBER ", 10, true, " 설명 "
        ));

        assertThat(saved).isEqualTo(new SystemPolicy(
                "LOGIN_LIMIT", "로그인 제한", "3", "NUMBER", 10, true, "설명"
        ));
        verify(repository).save(saved);
        verify(cacheService).refresh("LOGIN_LIMIT", saved);
        verifyNoInteractions(brandingCacheService);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "BRANDING_COMPANY_LOGO_URL",
            "BRANDING_FAVICON_URL",
            "BRANDING_LOGIN_BACKGROUND_URL"
    })
    void changingBrandingPolicyEvictsBrandingSettings(String policyKey) {
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        service.createPolicy(new SystemPolicy(policyKey, "Branding", "/branding/image.png", "TEXT", 10, true, null));

        verify(brandingCacheService).evict();
    }
}
