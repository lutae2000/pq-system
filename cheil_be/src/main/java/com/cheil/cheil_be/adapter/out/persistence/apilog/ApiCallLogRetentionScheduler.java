package com.cheil.cheil_be.adapter.out.persistence.apilog;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.adapter.out.persistence.systempolicy.JpaSystemPolicyRepository;

@Component
@RequiredArgsConstructor
public class ApiCallLogRetentionScheduler {

    private static final String RETENTION_POLICY_KEY = "API_AUDIT_LOG_RETENTION_DAYS";

    private final ApiCallLogJpaRepository apiCallLogRepository;
    private final JpaSystemPolicyRepository systemPolicyRepository;
    private final Clock clock;

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void deleteExpiredLogs() {
        systemPolicyRepository.findById(RETENTION_POLICY_KEY)
                .filter(policy -> policy.isUseYn())
                .map(policy -> parseDays(policy.getPolicyValue()))
                .filter(days -> days > 0)
                .ifPresent(days -> apiCallLogRepository.deleteByOccurredAtBefore(Instant.now(clock).minus(Duration.ofDays(days))));
    }

    private static int parseDays(String value) {
        try {
            return Integer.parseInt(value.trim());
        } catch (RuntimeException exception) {
            return 0;
        }
    }
}
