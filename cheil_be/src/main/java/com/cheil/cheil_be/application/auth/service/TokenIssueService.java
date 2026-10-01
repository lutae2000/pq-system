package com.cheil.cheil_be.application.auth.service;

import java.time.Clock;
import java.time.Instant;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import com.cheil.cheil_be.application.auth.port.in.IssueTokenCommand;
import com.cheil.cheil_be.application.auth.port.in.IssueTokenUseCase;
import com.cheil.cheil_be.application.auth.port.out.TokenIssueHistoryRecorder;
import com.cheil.cheil_be.application.auth.port.out.TokenIssuePolicy;
import com.cheil.cheil_be.application.auth.port.out.TokenProvider;
import com.cheil.cheil_be.domain.auth.IssuedToken;

@Service
@Slf4j
@RequiredArgsConstructor
public class TokenIssueService implements IssueTokenUseCase {

    private final TokenProvider tokenProvider;
    private final TokenIssueHistoryRecorder tokenIssueHistoryRecorder;
    private final TokenIssuePolicy tokenIssuePolicy;
    private final Clock clock;

    @Override
    public IssuedToken issue(IssueTokenCommand command) {
        if (command == null) {
            throw new IllegalArgumentException("토큰 발급 요청은 필수입니다.");
        }

        Instant issuedAt = Instant.now(clock);
        Instant expiresAt = issuedAt.plus(tokenIssuePolicy.ttl());
        IssuedToken issuedToken = tokenProvider.issue(
                tokenIssuePolicy.issuer(),
                command.serviceId(),
                command.scopes(),
                issuedAt,
                expiresAt
        );
        try {
            // 토큰 발급 자체가 완료된 뒤 이력을 남깁니다. 이력 저장소 장애가 인증 토큰
            // 발급까지 실패시키면 외부 연동이 함께 중단되므로 감사 로그로만 기록합니다.
            tokenIssueHistoryRecorder.record(
                    tokenIssuePolicy.issuer(),
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
