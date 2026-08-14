package com.cheil.cheil_be.application.userauth.port.in;

import org.springframework.util.StringUtils;

public record LoginCommand(String loginId, String userPassword) {

    public LoginCommand {
        if (!StringUtils.hasText(loginId)) {
            throw new IllegalArgumentException("로그인 아이디는 필수입니다.");
        }
        if (!StringUtils.hasText(userPassword)) {
            throw new IllegalArgumentException("비밀번호는 필수입니다.");
        }
    }
}
