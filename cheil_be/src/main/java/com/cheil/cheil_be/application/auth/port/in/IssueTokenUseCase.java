package com.cheil.cheil_be.application.auth.port.in;

import com.cheil.cheil_be.domain.auth.IssuedToken;

public interface IssueTokenUseCase {

    IssuedToken issue(IssueTokenCommand command);
}
