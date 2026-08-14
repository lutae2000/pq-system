package com.cheil.cheil_be.application.common.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.cheil.cheil_be.application.common.port.out.PasswordHasher;

/**
 * 비밀번호 저장/검증 시 사용하는 공통 해시 서비스입니다.
 */
@Service
@RequiredArgsConstructor
public class PasswordHashService {

    private final PasswordHasher passwordHasher;

    public String hash(CharSequence rawPassword) {
        return passwordHasher.hash(rawPassword);
    }

    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        return passwordHasher.matches(rawPassword, encodedPassword);
    }
}
