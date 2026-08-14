package com.cheil.cheil_be.application.auth.port.out;

import java.time.Instant;
import java.util.Set;

import com.cheil.cheil_be.domain.auth.IssuedToken;

/**
 * Output port for issuing signed communication tokens.
 */
@FunctionalInterface
public interface TokenProvider {

    IssuedToken issue(String issuer, String serviceId, Set<String> scopes, Instant issuedAt, Instant expiresAt);
}
