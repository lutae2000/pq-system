package com.cheil.cheil_be.application.auth.port.in;

import java.util.Set;

public record IssueTokenCommand(String serviceId, Set<String> scopes) {

    public IssueTokenCommand {
        // 외부 요청에서 전달된 공백 문자열을 서비스 식별자로 허용하면
        // 인증 주체와 발급 이력의 연결이 끊길 수 있으므로 경계에서 차단합니다.
        if (serviceId == null || serviceId.isBlank()) {
            throw new IllegalArgumentException("서비스 ID는 필수입니다.");
        }
        scopes = scopes == null ? Set.of() : Set.copyOf(scopes);
    }
}
