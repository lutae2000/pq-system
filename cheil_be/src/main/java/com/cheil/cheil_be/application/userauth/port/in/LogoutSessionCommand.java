package com.cheil.cheil_be.application.userauth.port.in;

import org.springframework.util.StringUtils;

public record LogoutSessionCommand(String loginId, String sessionId) {

    public LogoutSessionCommand {
        if (!StringUtils.hasText(loginId)) {
            throw new IllegalArgumentException("로그인 아이디는 필수입니다.");
        }
        if (!StringUtils.hasText(sessionId)) {
            throw new IllegalArgumentException("세션 ID는 필수입니다.");
        }
    }
}
