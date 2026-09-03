package com.cheil.cheil_be.application.userauth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.out.crypto.BCryptPasswordHasher;
import com.cheil.cheil_be.application.common.service.PasswordHashService;
import com.cheil.cheil_be.application.common.service.PasswordVerificationService;
import com.cheil.cheil_be.application.systempolicy.service.LoginSessionPolicyService;
import com.cheil.cheil_be.application.userauth.port.in.LoginCommand;
import com.cheil.cheil_be.application.userauth.port.out.LoginSessionStore;
import com.cheil.cheil_be.application.userauth.port.out.UserAccountRepository;
import com.cheil.cheil_be.config.security.AppSecurityProperties;
import com.cheil.cheil_be.domain.userauth.UserAccount;

class UserLoginServiceTest {

    private final InMemoryUserAccountRepository repository = new InMemoryUserAccountRepository();
    private final InMemoryLoginSessionStore loginSessionStore = new InMemoryLoginSessionStore();
    private final UserLoginService service = new UserLoginService(
            repository,
            new PasswordVerificationService(new PasswordHashService(new BCryptPasswordHasher(new BCryptPasswordEncoder(4)))),
            loginSessionStore,
            loginSessionPolicyService(),
            Clock.fixed(Instant.parse("2026-06-18T00:00:00Z"), ZoneOffset.UTC)
    );

    @Test
    void loginSucceedsWithPlainTextPassword() {
        repository.put(new UserAccount(
                "150801",
                "성태",
                "stleekm",
                "kmlee0414",
                true,
                "100",
                "0",
                Instant.parse("2026-06-22T13:36:00Z"),
                null,
                null,
                false,
                false,
                0,
                null,
                Instant.parse("2026-06-22T13:36:00Z"),
                null
        ));

        var result = service.login(new LoginCommand("stleekm", "kmlee0414"), "127.0.0.1");

        assertThat(result.loginId()).isEqualTo("stleekm");
        assertThat(result.loginDt()).isEqualTo(Instant.parse("2026-06-18T00:00:00Z"));
        assertThat(result.recentIpAddr()).isEqualTo("127.0.0.1");
        assertThat(result.session().expiresAt()).isEqualTo(Instant.parse("2026-06-18T04:00:00Z"));
        assertThat(result.session().timeoutMinutes()).isEqualTo(240);
        assertThat(result.session().idleTimeoutMinutes()).isEqualTo(60);
        assertThat(loginSessionStore.issuedTtl).isEqualTo(Duration.ofHours(4));
        assertThat(repository.findByLoginId("stleekm")).isPresent();
        var saved = repository.findByLoginId("stleekm").orElseThrow();
        assertThat(saved.loginDt()).isEqualTo(Instant.parse("2026-06-18T00:00:00Z"));
        assertThat(saved.recentIpAddr()).isEqualTo("127.0.0.1");
        assertThat(saved.wrongPasswordCount()).isZero();
    }

    @Test
    void loginRejectsWrongPasswordAndIncrementsFailureCount() {
        repository.put(new UserAccount(
                "150801",
                "성태",
                "stleekm",
                "kmlee0414",
                true,
                "100",
                "0",
                Instant.parse("2026-06-22T13:36:00Z"),
                null,
                null,
                false,
                false,
                0,
                null,
                Instant.parse("2026-06-22T13:36:00Z"),
                null
        ));

        Throwable thrown = catchThrowable(() -> service.login(new LoginCommand("stleekm", "wrong"), "127.0.0.1"));
        assertThat(thrown).isInstanceOf(ResponseStatusException.class);
        assertThat(((ResponseStatusException) thrown).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(((ResponseStatusException) thrown).getReason()).isEqualTo("비밀번호가 올바르지 않습니다.");

        assertThat(repository.findByLoginId("stleekm").orElseThrow().wrongPasswordCount()).isEqualTo(1);
    }

    @Test
    void loginRejectsMissingLoginId() {
        Throwable thrown = catchThrowable(() -> service.login(new LoginCommand("missing", "wrong"), "127.0.0.1"));
        assertThat(thrown).isInstanceOf(ResponseStatusException.class);
        assertThat(((ResponseStatusException) thrown).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(((ResponseStatusException) thrown).getReason()).isEqualTo("존재하지 않는 계정 입니다.");
    }

    @Test
    void loginRejectsInactiveAccount() {
        repository.put(new UserAccount(
                "150801",
                "성태",
                "stleekm",
                "kmlee0414",
                false,
                "100",
                "0",
                Instant.parse("2026-06-22T13:36:00Z"),
                null,
                null,
                false,
                false,
                0,
                null,
                Instant.parse("2026-06-22T13:36:00Z"),
                null
        ));

        Throwable thrown = catchThrowable(() -> service.login(new LoginCommand("stleekm", "kmlee0414"), "127.0.0.1"));
        assertThat(thrown).isInstanceOf(ResponseStatusException.class);
        assertThat(((ResponseStatusException) thrown).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(((ResponseStatusException) thrown).getReason()).isEqualTo("비활성화된 계정입니다.");
    }

    private static final class InMemoryUserAccountRepository implements UserAccountRepository {

        private final Map<String, UserAccount> users = new HashMap<>();

        @Override
        public java.util.List<UserAccount> findAll() {
            return java.util.List.copyOf(users.values());
        }

        @Override
        public Optional<UserAccount> findByEmployeeNo(String employeeNo) {
            return users.values().stream()
                    .filter(user -> user.employeeNo().equals(employeeNo))
                    .findFirst();
        }

        @Override
        public Optional<UserAccount> findByLoginId(String loginId) {
            return Optional.ofNullable(users.get(loginId));
        }

        @Override
        public boolean existsByEmployeeNo(String employeeNo) {
            return users.values().stream().anyMatch(user -> user.employeeNo().equals(employeeNo));
        }

        @Override
        public boolean existsByLoginId(String loginId) {
            return users.containsKey(loginId);
        }

        @Override
        public UserAccount save(UserAccount userAccount) {
            users.put(userAccount.loginId(), userAccount);
            return userAccount;
        }

        void put(UserAccount userAccount) {
            users.put(userAccount.loginId(), userAccount);
        }
    }

    private static LoginSessionPolicyService loginSessionPolicyService() {
        return new LoginSessionPolicyService(
                new AppSecurityProperties(
                        new AppSecurityProperties.Token("cheil-be-test", "0123456789abcdef0123456789abcdef", Duration.ofHours(1)),
                        new AppSecurityProperties.UserSession(Duration.ofHours(4), Duration.ofHours(1)),
                        Map.of(),
                        null,
                        null
                ),
                null,
                null
        );
    }

    private static final class InMemoryLoginSessionStore implements LoginSessionStore {

        private Duration issuedTtl;
        private String currentSessionId;

        @Override
        public String issue(String loginId, Duration ttl) {
            this.issuedTtl = ttl;
            this.currentSessionId = "session-123";
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
            currentSessionId = null;
        }
    }
}
