package com.cheil.cheil_be.application.userauth.port.in;

public interface LoginUseCase {

    LoginResult login(LoginCommand command, String clientIp);
}
