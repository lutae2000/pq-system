package com.cheil.cheil_be.application.common.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.cheil.cheil_be.adapter.out.crypto.BCryptPasswordHasher;

class PasswordVerificationServiceTest {

    private final PasswordVerificationService passwordVerificationService =
            new PasswordVerificationService(new PasswordHashService(new BCryptPasswordHasher(new BCryptPasswordEncoder(4))));

    @Test
    void matchesPlainTextPassword() {
        assertThat(passwordVerificationService.matches("password-1234", "password-1234")).isTrue();
    }

    @Test
    void matchesBcryptPassword() {
        String encoded = new BCryptPasswordEncoder(4).encode("password-1234");

        assertThat(passwordVerificationService.matches("password-1234", encoded)).isTrue();
    }

    @Test
    void rejectsWrongPassword() {
        assertThat(passwordVerificationService.matches("wrong-password", "password-1234")).isFalse();
    }
}
