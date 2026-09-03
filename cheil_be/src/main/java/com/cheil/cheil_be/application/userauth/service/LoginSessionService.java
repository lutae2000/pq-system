package com.cheil.cheil_be.application.userauth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.application.userauth.port.in.ValidateLoginSessionCommand;
import com.cheil.cheil_be.application.userauth.port.in.ValidateLoginSessionUseCase;
import com.cheil.cheil_be.application.userauth.port.out.LoginSessionStore;
import com.cheil.cheil_be.application.systempolicy.service.LoginSessionPolicyService;

@Service
@RequiredArgsConstructor
public class LoginSessionService implements ValidateLoginSessionUseCase {

    private final LoginSessionStore loginSessionStore;
    private final LoginSessionPolicyService loginSessionPolicyService;

    @Override
    public void validate(ValidateLoginSessionCommand command) {
        if (!loginSessionPolicyService.isSingleSessionLimitEnabled()) {
            return;
        }
        var currentSessionId = loginSessionStore.currentSessionId(command.loginId());
        if (currentSessionId.isPresent() && !currentSessionId.get().equals(command.sessionId())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "다른 기기에서 로그인되어 세션 로그아웃 되었습니다.");
        }

        if (!loginSessionStore.isCurrent(command.loginId(), command.sessionId())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 세션이 유효하지 않습니다.");
        }
    }
}
