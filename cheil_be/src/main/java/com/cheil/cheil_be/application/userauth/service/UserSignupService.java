package com.cheil.cheil_be.application.userauth.service;

import static com.cheil.cheil_be.application.common.exception.ApplicationException.badRequest;
import static com.cheil.cheil_be.application.common.exception.ApplicationException.conflict;
import static com.cheil.cheil_be.application.common.validation.InputValues.requiredText;
import static com.cheil.cheil_be.application.common.validation.InputValues.requireNonNull;

import java.time.Clock;
import java.time.Instant;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.common.service.PasswordHashService;
import com.cheil.cheil_be.application.userauth.port.in.SignupCommand;
import com.cheil.cheil_be.application.userauth.port.in.SignupResult;
import com.cheil.cheil_be.application.userauth.port.in.SignupUseCase;
import com.cheil.cheil_be.application.userauth.port.out.UserAccountRepository;
import com.cheil.cheil_be.domain.userauth.UserAccount;

@Service
@RequiredArgsConstructor
public class UserSignupService implements SignupUseCase {

    private final UserAccountRepository userAccountRepository;
    private final PasswordHashService passwordHashService;
    private final Clock clock;

    @Override
    @Transactional
    public SignupResult signup(SignupCommand command) {
        validate(command);

        // 사번과 로그인 ID를 각각 확인해 DB 제약조건 오류 대신 일관된 업무 오류를 반환합니다.
        if (userAccountRepository.existsByEmployeeNo(command.employeeNo())) {
            throw conflict("이미 존재하는 사번입니다.");
        }
        if (userAccountRepository.existsByLoginId(command.loginId())) {
            throw conflict("이미 존재하는 로그인 ID입니다.");
        }

        Instant occurredAt = Instant.now(clock);
        UserAccount created = userAccountRepository.save(new UserAccount(
                command.employeeNo().trim(),
                command.userName().trim(),
                command.loginId().trim(),
                passwordHashService.hash(command.userPassword()),
                false,
                command.groupCode().trim(),
                command.deptCode().trim(),
                null,
                null,
                null,
                false,
                false,
                0,
                null,
                occurredAt,
                command.loginId().trim()
        ));

        return new SignupResult(
                created.employeeNo(), created.loginId(), created.userName(),
                created.groupCode(), created.deptCode(), created.useYn()
        );
    }

    private void validate(SignupCommand command) {
        requireNonNull(command, "회원가입 요청은 필수입니다.");
        requiredText(command.employeeNo(), "employeeNo");
        requiredText(command.userName(), "userName");
        requiredText(command.loginId(), "loginId");
        requiredText(command.userPassword(), "userPassword");
        requiredText(command.groupCode(), "groupCode");
        requiredText(command.deptCode(), "deptCode");
    }

}
