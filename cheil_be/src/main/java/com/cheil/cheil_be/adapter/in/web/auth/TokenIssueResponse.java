package com.cheil.cheil_be.adapter.in.web.auth;

import java.time.Instant;

import com.cheil.cheil_be.domain.auth.IssuedToken;

public record TokenIssueResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        Instant expiresAt,
        String serviceId
) {

    static TokenIssueResponse from(IssuedToken token) {
        return new TokenIssueResponse(
                token.accessToken(),
                token.tokenType(),
                token.expiresIn(),
                token.expiresAt(),
                token.serviceId()
        );
    }
}
