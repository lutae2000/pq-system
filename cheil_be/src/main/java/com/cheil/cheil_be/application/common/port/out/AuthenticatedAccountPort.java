package com.cheil.cheil_be.application.common.port.out;

import java.util.Optional;

/** Identifies the authenticated employee for use cases that store account-owned data. */
public interface AuthenticatedAccountPort {
    Optional<String> authenticatedEmployeeNo();
}
