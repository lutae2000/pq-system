package com.cheil.cheil_be.application.systempolicy.service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Optional;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import com.cheil.cheil_be.adapter.out.persistence.systempolicy.JpaSystemPolicyRepository;
import com.cheil.cheil_be.adapter.out.persistence.systempolicy.SystemPolicyEntity;
import com.cheil.cheil_be.config.security.AppSecurityProperties;

@Service
@RequiredArgsConstructor
public class LoginSessionPolicyService {

    private final AppSecurityProperties securityProperties;
    private final JpaSystemPolicyRepository systemPolicyRepository;

    public Duration sessionTimeout() {
        return securityProperties.userSession().ttl();
    }

    public Duration idleTimeout() {
        return securityProperties.userSession().idleTtl();
    }

    public boolean isSingleSessionLimitEnabled() {
        return enabled("SINGLE_SESSION_LIMIT_ENABLED");
    }

    public boolean isPasswordChangeExpired(String passwordResetDt, boolean passwordReset, Instant now) {
        if (passwordReset) {
            return true;
        }

        Optional<SystemPolicyEntity> policy = enabledPolicy("PASSWORD_CHANGE_PERIOD_DAYS");
        if (policy.isEmpty()) {
            return false;
        }

        int days = numberValue(policy.get(), 0);
        if (days <= 0 || passwordResetDt == null || passwordResetDt.isBlank()) {
            return passwordResetDt == null || passwordResetDt.isBlank();
        }

        try {
            LocalDate resetDate = LocalDate.parse(passwordResetDt, DateTimeFormatter.BASIC_ISO_DATE);
            LocalDate expireDate = resetDate.plusDays(days);
            return !now.atZone(ZoneId.systemDefault()).toLocalDate().isBefore(expireDate);
        } catch (DateTimeParseException exception) {
            return true;
        }
    }

    public int passwordFailureLimit() {
        return enabledPolicy("PASSWORD_FAILURE_LIMIT")
                .map(policy -> numberValue(policy, 0))
                .orElse(0);
    }

    public boolean isInactiveLoginRestricted(Instant lastLoginAt, Instant now) {
        if (lastLoginAt == null) {
            return false;
        }
        return enabledPolicy("INACTIVE_LOGIN_LIMIT_DAYS")
                .map(policy -> numberValue(policy, 0))
                .filter(days -> days > 0)
                .map(days -> !now.isBefore(lastLoginAt.plus(Duration.ofDays(days))))
                .orElse(false);
    }

    private boolean enabled(String policyKey) {
        return enabledPolicy(policyKey).isPresent();
    }

    private Optional<SystemPolicyEntity> enabledPolicy(String policyKey) {
        return systemPolicyRepository == null
                ? Optional.empty()
                : systemPolicyRepository.findById(policyKey).filter(SystemPolicyEntity::isUseYn);
    }

    private static int numberValue(SystemPolicyEntity policy, int fallback) {
        try {
            return Integer.parseInt(policy.getPolicyValue().trim());
        } catch (RuntimeException exception) {
            return fallback;
        }
    }
}
