package com.cheil.cheil_be.adapter.out.crypto;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class BCryptPasswordHasherTest {

    private final BCryptPasswordHasher passwordHasher = new BCryptPasswordHasher(new BCryptPasswordEncoder(4));

    @Test
    void hashMatchesRawPassword() {
        String encoded = passwordHasher.hash("password-1234");

        assertThat(encoded).isNotEqualTo("password-1234");
        assertThat(passwordHasher.matches("password-1234", encoded)).isTrue();
    }

    @Test
    void matchesRejectsWrongPassword() {
        String encoded = passwordHasher.hash("password-1234");

        assertThat(passwordHasher.matches("wrong-password", encoded)).isFalse();
    }

    @Test
    void hashRejectsBlankPassword() {
        assertThatThrownBy(() -> passwordHasher.hash(" "))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
