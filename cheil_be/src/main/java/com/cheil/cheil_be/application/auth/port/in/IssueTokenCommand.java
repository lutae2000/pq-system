package com.cheil.cheil_be.application.auth.port.in;

import java.util.Set;

import org.springframework.util.StringUtils;

public record IssueTokenCommand(String serviceId, Set<String> scopes) {

    public IssueTokenCommand {
        if (!StringUtils.hasText(serviceId)) {
            throw new IllegalArgumentException("서비스 ID는 필수입니다.");
        }
        scopes = scopes == null ? Set.of() : Set.copyOf(scopes);
    }
}
