package com.cheil.cheil_be.application.userauth.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import com.cheil.cheil_be.application.userauth.port.in.LogoutSessionCommand;
import com.cheil.cheil_be.application.userauth.port.out.LoginSessionStore;

class LogoutSessionServiceTest {

    @Test
    void logoutRevokesCurrentSession() {
        var store = new InMemoryLoginSessionStore();
        store.currentSessionId = "session-123";
        var service = new LogoutSessionService(store);

        service.logout(new LogoutSessionCommand("stleekm", "session-123"));

        assertThat(store.revokedLoginId).isEqualTo("stleekm");
    }

    @Test
    void logoutIgnoresStaleSession() {
        var store = new InMemoryLoginSessionStore();
        store.currentSessionId = "session-123";
        var service = new LogoutSessionService(store);

        service.logout(new LogoutSessionCommand("stleekm", "session-old"));

        assertThat(store.revokedLoginId).isNull();
    }

    private static final class InMemoryLoginSessionStore implements LoginSessionStore {

        private String currentSessionId;
        private String revokedLoginId;

        @Override
        public String issue(String loginId, Duration ttl) {
            return "session-123";
        }

        @Override
        public Optional<String> currentSessionId(String loginId) {
            return Optional.ofNullable(currentSessionId);
        }

        @Override
        public boolean isCurrent(String loginId, String sessionId) {
            return currentSessionId != null && currentSessionId.equals(sessionId);
        }

        @Override
        public void revoke(String loginId) {
            revokedLoginId = loginId;
            currentSessionId = null;
        }
    }
}
