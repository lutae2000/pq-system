package com.cheil.cheil_be.application.auth.service;

import java.time.Clock;
import java.time.Instant;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import com.cheil.cheil_be.application.auth.port.in.IssueTokenCommand;
import com.cheil.cheil_be.application.auth.port.in.IssueTokenUseCase;
import com.cheil.cheil_be.application.auth.port.out.TokenIssueHistoryRecorder;
import com.cheil.cheil_be.application.auth.port.out.TokenProvider;
import com.cheil.cheil_be.config.security.AppSecurityProperties;
import com.cheil.cheil_be.domain.auth.IssuedToken;

@Service
@Slf4j
@RequiredArgsConstructor
public class TokenIssueService implements IssueTokenUseCase {

    private final TokenProvider tokenProvider;
    private final TokenIssueHistoryRecorder tokenIssueHistoryRecorder;
    private final AppSecurityProperties securityProperties;
    private final Clock clock;

    @Override
    public IssuedToken issue(IssueTokenCommand command) {
        Instant issuedAt = Instant.now(clock);
        Instant expiresAt = issuedAt.plus(securityProperties.token().ttl());
        IssuedToken issuedToken = tokenProvider.issue(
                securityProperties.token().issuer(),
                command.serviceId(),
                command.scopes(),
                issuedAt,
                expiresAt
        );
        try {
            tokenIssueHistoryRecorder.record(
                    securityProperties.token().issuer(),
                    command.serviceId(),
                    command.scopes(),
                    issuedToken,
                    issuedAt
            );
        } catch (RuntimeException ex) {
            log.warn("Failed to record token issue history for serviceId={}", command.serviceId(), ex);
        }
        return issuedToken;
    }
}
