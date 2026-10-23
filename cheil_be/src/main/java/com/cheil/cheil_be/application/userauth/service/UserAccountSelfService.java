package com.cheil.cheil_be.application.userauth.service;

import static com.cheil.cheil_be.application.common.validation.InputValues.requiredText;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.common.service.PasswordHashService;
import com.cheil.cheil_be.application.common.service.PasswordVerificationService;
import com.cheil.cheil_be.application.userauth.port.in.UserAccountSelfUseCase;
import com.cheil.cheil_be.application.userauth.port.out.UserAccountRepository;
import com.cheil.cheil_be.common.text.StringValues;
import com.cheil.cheil_be.domain.userauth.UserAccount;

@Service
@RequiredArgsConstructor
public class UserAccountSelfService implements UserAccountSelfUseCase {

    private static final DateTimeFormatter PASSWORD_RESET_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final UserAccountRepository repository;
    private final PasswordHashService passwordHashService;
    private final PasswordVerificationService passwordVerificationService;
    private final CurrentActorPort currentActorPort;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public UserAccount findByLoginId(String loginId) {
        return repository.findByLoginId(requiredText(loginId, "loginId"))
                .orElseThrow(() -> ApplicationException.notFound("사용자 계정을 찾을 수 없습니다."));
    }

    @Override
    @Transactional
    public UserAccount changePassword(String loginId, String currentPassword, String newPassword) {
        UserAccount account = findByLoginId(loginId);
        verifyCurrentPassword(account, currentPassword);
        Instant now = Instant.now(clock);
        return repository.save(account.changePassword(
                passwordHashService.hash(requiredText(newPassword, "newPassword")),
                passwordResetDate(now), now, currentActorPort.currentActor()
        ));
    }

    @Override
    @Transactional
    public UserAccount updateProfile(
            String loginId,
            String employeeNo,
            String deptCode,
            String email,
            String currentPassword,
            String newPassword
    ) {
        UserAccount account = findByLoginId(loginId);
        String nextEmployeeNo = requiredText(employeeNo, "employeeNo");
        repository.findByEmployeeNo(nextEmployeeNo)
                .filter(item -> !item.loginId().equals(account.loginId()))
                .ifPresent(item -> { throw ApplicationException.conflict("이미 사용 중인 사번입니다."); });

        String encodedPassword = account.userPassword();
        String passwordResetDt = account.passwordResetDt();
        boolean passwordReset = account.passwordReset();
        if (StringUtils.hasText(newPassword)) {
            verifyCurrentPassword(account, currentPassword);
            encodedPassword = passwordHashService.hash(newPassword.trim());
            passwordResetDt = passwordResetDate(Instant.now(clock));
            passwordReset = false;
        }

        Instant now = Instant.now(clock);
        return repository.save(account.updateProfile(
                nextEmployeeNo, requiredText(deptCode, "deptCode"), StringValues.normalize(email),
                encodedPassword, passwordResetDt, passwordReset, now, currentActorPort.currentActor()
        ));
    }

    private void verifyCurrentPassword(UserAccount account, String currentPassword) {
        String password = requiredText(currentPassword, "currentPassword");
        if (!passwordVerificationService.matches(password, account.userPassword())) {
            throw ApplicationException.unauthorized("현재 비밀번호가 올바르지 않습니다.");
        }
    }

    private static String passwordResetDate(Instant occurredAt) {
        return PASSWORD_RESET_DATE_FORMATTER.format(occurredAt.atZone(ZoneId.systemDefault()));
    }
}
