package com.cheil.cheil_be.application.systempolicy.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import com.cheil.cheil_be.adapter.out.persistence.systempolicy.JpaSystemPolicyRepository;
import com.cheil.cheil_be.config.security.AppSecurityProperties;

class LoginSessionPolicyServiceTest {

    private static final Instant NOW = Instant.parse("2026-10-06T00:00:00Z");

    private final JpaSystemPolicyRepository repository = mock(JpaSystemPolicyRepository.class);
    private final SystemPolicyCacheService cacheService = mock(SystemPolicyCacheService.class);
    private final LoginSessionPolicyService service = new LoginSessionPolicyService(
            securityProperties(),
            repository,
            cacheService
    );

    @Test
    void passwordChangeIsNotRequiredWhenPeriodPolicyIsDisabled() {
        when(cacheService.getOrLoad("PASSWORD_CHANGE_PERIOD_DAYS", org.mockito.ArgumentMatchers.any()))
                .thenReturn(Optional.of(new SystemPolicyCacheService.CachedPolicy(false, "90")));

        boolean expired = service.isPasswordChangeExpired(null, true, NOW);

        assertThat(expired).isFalse();
    }

    @Test
    void passwordChangeIsRequiredForResetAccountWhenPeriodPolicyIsEnabled() {
        when(cacheService.getOrLoad("PASSWORD_CHANGE_PERIOD_DAYS", org.mockito.ArgumentMatchers.any()))
                .thenReturn(Optional.of(new SystemPolicyCacheService.CachedPolicy(true, "90")));

        boolean expired = service.isPasswordChangeExpired(null, true, NOW);

        assertThat(expired).isTrue();
    }

    private static AppSecurityProperties securityProperties() {
        return new AppSecurityProperties(
                new AppSecurityProperties.Token(
                        "cheil-be-test",
                        "0123456789abcdef0123456789abcdef",
                        Duration.ofHours(1)
                ),
                new AppSecurityProperties.UserSession(Duration.ofHours(4), Duration.ofHours(1)),
                Map.of(),
                null,
                null
        );
    }
}
