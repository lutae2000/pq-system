package com.cheil.cheil_be.application.userauth.service;

import java.time.Clock;
import java.time.Instant;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
        if (userAccountRepository.existsByEmployeeNo(command.employeeNo())) {
            throw conflict("이미 존재하는 사번입니다.");
        }
        if (userAccountRepository.existsByLoginId(command.loginId())) {
            throw conflict("이미 존재하는 로그인 아이디입니다.");
        }

        Instant occurredAt = Instant.now(clock);
        UserAccount created = userAccountRepository.save(new UserAccount(
                command.employeeNo(),
                command.userName(),
                command.loginId(),
                passwordHashService.hash(command.userPassword()),
                false,
                command.groupCode(),
                command.deptCode(),
                null,
                null,
                null,
                false,
                false,
                0,
                null,
                occurredAt,
                command.loginId()
        ));

        return new SignupResult(
                created.employeeNo(),
                created.loginId(),
                created.userName(),
                created.groupCode(),
                created.deptCode(),
                created.useYn()
        );
    }

    private ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }
}
