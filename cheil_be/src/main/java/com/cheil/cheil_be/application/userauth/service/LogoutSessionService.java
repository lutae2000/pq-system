package com.cheil.cheil_be.application.userauth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.cheil.cheil_be.application.userauth.port.in.LogoutSessionCommand;
import com.cheil.cheil_be.application.userauth.port.in.LogoutSessionUseCase;
import com.cheil.cheil_be.application.userauth.port.out.LoginSessionStore;

@Service
@RequiredArgsConstructor
public class LogoutSessionService implements LogoutSessionUseCase {

    private final LoginSessionStore loginSessionStore;

    @Override
    public void logout(LogoutSessionCommand command) {
        if (loginSessionStore.isCurrent(command.loginId(), command.sessionId())) {
            loginSessionStore.revoke(command.loginId());
        }
    }
}
