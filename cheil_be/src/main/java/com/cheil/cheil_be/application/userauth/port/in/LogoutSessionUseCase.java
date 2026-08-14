package com.cheil.cheil_be.application.userauth.port.in;

public interface LogoutSessionUseCase {

    void logout(LogoutSessionCommand command);
}
