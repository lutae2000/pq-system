package com.cheil.cheil_be.application.userauth.port.in;

public interface ValidateLoginSessionUseCase {

    void validate(ValidateLoginSessionCommand command);
}
