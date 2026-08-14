package com.cheil.cheil_be.application.userauth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;

import java.time.Clock;
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
import com.cheil.cheil_be.application.userauth.port.in.SignupCommand;
import com.cheil.cheil_be.application.userauth.port.out.UserAccountRepository;
import com.cheil.cheil_be.domain.userauth.UserAccount;

class UserSignupServiceTest {

    private final InMemoryUserAccountRepository repository = new InMemoryUserAccountRepository();
    private final UserSignupService service = new UserSignupService(
            repository,
            new PasswordHashService(new BCryptPasswordHasher(new BCryptPasswordEncoder(4))),
            Clock.fixed(Instant.parse("2026-06-18T00:00:00Z"), ZoneOffset.UTC)
    );

    @Test
    void signupHashesPasswordAndStoresNewUser() {
        var result = service.signup(new SignupCommand(
                "250001",
                "성태",
                "stleekm",
                "kmlee0414",
                "10",
                "100"
        ));

        assertThat(result.employeeNo()).isEqualTo("250001");
        assertThat(result.loginId()).isEqualTo("stleekm");
        assertThat(repository.findByLoginId("stleekm")).isPresent();
        assertThat(repository.findByLoginId("stleekm").orElseThrow().userPassword()).startsWith("$2");
    }

    @Test
    void signupRejectsDuplicateLoginId() {
        repository.put(new UserAccount(
                "250001",
                "기존유저",
                "stleekm",
                "pw",
                true,
                "100",
                "10",
                null,
                null,
                null,
                false,
                false,
                0,
                null,
                Instant.parse("2026-06-18T00:00:00Z"),
                null
        ));

        Throwable thrown = catchThrowable(() -> service.signup(new SignupCommand(
                "250002",
                "성태",
                "stleekm",
                "kmlee0414",
                "10",
                "100"
        )));

        assertThat(thrown).isInstanceOf(ResponseStatusException.class);
        assertThat(((ResponseStatusException) thrown).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(((ResponseStatusException) thrown).getReason()).isEqualTo("이미 존재하는 로그인 아이디입니다.");
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
}
