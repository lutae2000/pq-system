package com.cheil.cheil_be.application.common.port.out;

public interface PasswordHasher {

    String hash(CharSequence rawPassword);

    boolean matches(CharSequence rawPassword, String encodedPassword);
}
