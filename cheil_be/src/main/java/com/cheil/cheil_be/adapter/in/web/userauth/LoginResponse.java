package com.cheil.cheil_be.adapter.in.web.userauth;

import java.time.Instant;

import com.cheil.cheil_be.application.userauth.port.in.LoginSessionResult;
import com.cheil.cheil_be.application.userauth.port.in.LoginResult;
import com.cheil.cheil_be.application.userauth.service.LoginAccessTokenService.LoginAccessToken;

public record LoginResponse(
        String employeeNo,
        String loginId,
        String userName,
        String groupCode,
        String deptCode,
        boolean useYn,
        Instant loginDt,
        String recentIpAddr,
        boolean passwordReset,
        AccessTokenResponse token,
        SessionResponse session
) {

    static LoginResponse from(LoginResult result, LoginAccessToken token) {
        return new LoginResponse(
                result.employeeNo(),
                result.loginId(),
                result.userName(),
                result.groupCode(),
                result.deptCode(),
                result.useYn(),
                result.loginDt(),
                result.recentIpAddr(),
                result.passwordReset(),
                AccessTokenResponse.from(token),
                SessionResponse.from(result.session())
        );
    }

    public record AccessTokenResponse(
            String accessToken,
            String tokenType,
            Instant expiresAt
    ) {

        static AccessTokenResponse from(LoginAccessToken token) {
            return new AccessTokenResponse(
                    token.accessToken(),
                    token.tokenType(),
                    token.expiresAt()
            );
        }
    }

    public record SessionResponse(
            String id,
            Instant expiresAt,
            long timeoutMinutes,
            long idleTimeoutMinutes
    ) {

        static SessionResponse from(LoginSessionResult session) {
            return new SessionResponse(
                    session.id(),
                    session.expiresAt(),
                    session.timeoutMinutes(),
                    session.idleTimeoutMinutes()
            );
        }
    }
}
