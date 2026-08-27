package com.cheil.cheil_be.application.userauth.service;

import java.time.Clock;
import java.time.Instant;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.application.common.service.PasswordVerificationService;
import com.cheil.cheil_be.application.systempolicy.service.LoginSessionPolicyService;
import com.cheil.cheil_be.application.userauth.port.in.LoginCommand;
import com.cheil.cheil_be.application.userauth.port.in.LoginResult;
import com.cheil.cheil_be.application.userauth.port.in.LoginSessionResult;
import com.cheil.cheil_be.application.userauth.port.in.LoginUseCase;
import com.cheil.cheil_be.application.userauth.port.out.LoginSessionStore;
import com.cheil.cheil_be.application.userauth.port.out.UserAccountRepository;
import com.cheil.cheil_be.domain.userauth.UserAccount;

@Service
@RequiredArgsConstructor
public class UserLoginService implements LoginUseCase {

    private final UserAccountRepository userAccountRepository;
    private final PasswordVerificationService passwordVerificationService;
    private final LoginSessionStore loginSessionStore;
    private final LoginSessionPolicyService loginSessionPolicyService;
    private final Clock clock;

    @Override
    @Transactional
    public LoginResult login(LoginCommand command, String clientIp) {
        UserAccount userAccount = userAccountRepository.findByLoginId(command.loginId())
                .orElseThrow(this::loginIdNotFound);

        if (!userAccount.useYn()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "비활성화된 계정입니다.");
        }

        Instant occurredAt = Instant.now(clock);
        if (loginSessionPolicyService.isInactiveLoginRestricted(userAccount.loginDt(), occurredAt)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "장기 미접속으로 로그인이 제한된 계정입니다.");
        }

        int passwordFailureLimit = loginSessionPolicyService.passwordFailureLimit();
        if (passwordFailureLimit > 0 && userAccount.wrongPasswordCount() >= passwordFailureLimit) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 실패 횟수 제한을 초과했습니다.");
        }

        if (!passwordVerificationService.matches(command.userPassword(), userAccount.userPassword())) {
            userAccountRepository.save(userAccount.recordFailedLogin());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "비밀번호가 올바르지 않습니다.");
        }

        var sessionTimeout = loginSessionPolicyService.sessionTimeout();
        var idleTimeout = loginSessionPolicyService.idleTimeout();
        Instant sessionExpiresAt = occurredAt.plus(sessionTimeout);
        UserAccount updated = userAccount.recordSuccessfulLogin(clientIp, occurredAt);
        userAccountRepository.save(updated);
        String sessionId = loginSessionStore.issue(updated.loginId(), sessionTimeout);
        return new LoginResult(
                updated.employeeNo(),
                updated.loginId(),
                updated.userName(),
                updated.groupCode(),
                updated.deptCode(),
                updated.useYn(),
                updated.loginDt(),
                updated.recentIpAddr(),
                loginSessionPolicyService.isPasswordChangeExpired(updated.passwordResetDt(), updated.passwordReset(), occurredAt),
                new LoginSessionResult(
                        sessionId,
                        sessionExpiresAt,
                        sessionTimeout.toMinutes(),
                        idleTimeout.toMinutes()
                )
        );
    }

    private ResponseStatusException loginIdNotFound() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "존재하지 않는 계정 입니다.");
    }
}
