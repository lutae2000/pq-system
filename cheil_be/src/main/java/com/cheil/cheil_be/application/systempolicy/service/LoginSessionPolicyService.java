package com.cheil.cheil_be.application.systempolicy.service;

import java.time.Duration;

import org.springframework.stereotype.Service;

import com.cheil.cheil_be.config.security.AppSecurityProperties;

@Service
public class LoginSessionPolicyService {

    private final AppSecurityProperties securityProperties;

    public LoginSessionPolicyService(AppSecurityProperties securityProperties) {
        this.securityProperties = securityProperties;
    }

    public Duration sessionTimeout() {
        return securityProperties.userSession().ttl();
    }

    public Duration idleTimeout() {
        return securityProperties.userSession().idleTtl();
    }
}
