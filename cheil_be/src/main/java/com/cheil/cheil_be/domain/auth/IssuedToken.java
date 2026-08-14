package com.cheil.cheil_be.domain.auth;

import java.time.Instant;

public record IssuedToken(
        String accessToken,
        String tokenType,
        long expiresIn,
        Instant expiresAt,
        String serviceId
) {
}
