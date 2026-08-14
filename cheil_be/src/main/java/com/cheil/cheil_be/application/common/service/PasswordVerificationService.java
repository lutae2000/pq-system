package com.cheil.cheil_be.application.common.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class PasswordVerificationService {

    private final PasswordHashService passwordHashService;

    public boolean matches(CharSequence rawPassword, String storedPassword) {
        if (rawPassword == null || !StringUtils.hasText(storedPassword)) {
            return false;
        }

        String raw = rawPassword.toString();
        if (looksHashed(storedPassword)) {
            return passwordHashService.matches(raw, stripPrefix(storedPassword));
        }
        return MessageDigest.isEqual(
                raw.getBytes(StandardCharsets.UTF_8),
                storedPassword.getBytes(StandardCharsets.UTF_8)
        );
    }

    private static boolean looksHashed(String storedPassword) {
        return storedPassword.startsWith("$2a$")
                || storedPassword.startsWith("$2b$")
                || storedPassword.startsWith("$2y$")
                || storedPassword.startsWith("{bcrypt}");
    }

    private static String stripPrefix(String storedPassword) {
        if (storedPassword.startsWith("{bcrypt}")) {
            return storedPassword.substring("{bcrypt}".length());
        }
        return storedPassword;
    }
}
