package com.cheil.cheil_be.application.userauth.port.in;

public interface SignupUseCase {

    SignupResult signup(SignupCommand command);
}
