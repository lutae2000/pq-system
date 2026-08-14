package com.cheil.cheil_be.adapter.out.crypto;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.cheil.cheil_be.application.common.port.out.PasswordHasher;

/**
 * Spring Security BCrypt encoder를 사용하는 비밀번호 해시 어댑터입니다.
 */
@Component
@RequiredArgsConstructor
public class BCryptPasswordHasher implements PasswordHasher {

    private final PasswordEncoder passwordEncoder;

    @Override
    public String hash(CharSequence rawPassword) {
        if (rawPassword == null || !StringUtils.hasText(rawPassword.toString())) {
            throw new IllegalArgumentException("rawPassword must not be blank");
        }
        return passwordEncoder.encode(rawPassword);
    }

    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        if (rawPassword == null || !StringUtils.hasText(encodedPassword)) {
            return false;
        }
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }
}
