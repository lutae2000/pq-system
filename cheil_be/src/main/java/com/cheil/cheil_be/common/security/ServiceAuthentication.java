package com.cheil.cheil_be.common.security;

import java.util.List;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

/**
 * 서비스 간 요청에서 인증된 주체를 Spring Security 인증 객체로 표현하는 타입입니다.
 */
public final class ServiceAuthentication extends AbstractAuthenticationToken {

    private final ServicePrincipal principal;

    public ServiceAuthentication(ServicePrincipal principal) {
        super(List.of(new SimpleGrantedAuthority("ROLE_SERVICE")));
        this.principal = principal;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return "";
    }

    @Override
    public ServicePrincipal getPrincipal() {
        return principal;
    }
}
