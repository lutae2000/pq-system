package com.cheil.cheil_be.adapter.in.web.userauth;

public record LoginRequest(
        String loginId,
        String userPassword
) {
}
