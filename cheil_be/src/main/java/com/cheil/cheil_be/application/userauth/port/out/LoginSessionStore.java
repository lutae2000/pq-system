package com.cheil.cheil_be.application.userauth.port.out;

import java.time.Duration;
import java.util.Optional;

public interface LoginSessionStore {

    String issue(String loginId, Duration ttl);

    Optional<String> currentSessionId(String loginId);

    boolean isCurrent(String loginId, String sessionId);

    void revoke(String loginId);
}
