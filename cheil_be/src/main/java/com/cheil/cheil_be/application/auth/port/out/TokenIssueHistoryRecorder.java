package com.cheil.cheil_be.application.auth.port.out;

import java.time.Instant;
import java.util.Set;

import com.cheil.cheil_be.domain.auth.IssuedToken;

/**
 * Records issued token history for later inspection or audit.
 */
public interface TokenIssueHistoryRecorder {

    void record(String issuer, String serviceId, Set<String> scopes, IssuedToken issuedToken, Instant issuedAt);
}
