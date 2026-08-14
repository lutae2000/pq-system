package com.cheil.cheil_be.application.userauth.port.in;

import java.time.Instant;

public record LoginSessionResult(
        String id,
        Instant expiresAt,
        long timeoutMinutes,
        long idleTimeoutMinutes
) {
}
