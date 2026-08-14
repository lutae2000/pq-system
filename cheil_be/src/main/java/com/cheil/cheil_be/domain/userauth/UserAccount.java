package com.cheil.cheil_be.domain.userauth;

import java.time.Instant;

import org.springframework.util.StringUtils;

/**
 * 사용자 계정 값 객체이다.
 */
public record UserAccount(
        String employeeNo,
        String userName,
        String loginId,
        String userPassword,
        boolean useYn,
        String groupCode,
        String deptCode,
        Instant loginDt,
        String recentIpAddr,
        String passwordResetDt,
        boolean passwordReset,
        boolean picYn,
        int wrongPasswordCount,
        String email,
        Instant lastChangedAt,
        String lastChangedId
) {

    public UserAccount {
        if (!StringUtils.hasText(employeeNo)) {
            throw new IllegalArgumentException("사번은 필수입니다.");
        }
        if (!StringUtils.hasText(userName)) {
            throw new IllegalArgumentException("이름은 필수입니다.");
        }
        if (userName.chars().anyMatch(Character::isWhitespace)) {
            throw new IllegalArgumentException("이름은 공백 없이 입력해야 합니다.");
        }
        if (!StringUtils.hasText(loginId)) {
            throw new IllegalArgumentException("로그인 아이디는 필수입니다.");
        }
        if (!StringUtils.hasText(userPassword)) {
            throw new IllegalArgumentException("비밀번호는 필수입니다.");
        }
    }

    public UserAccount recordSuccessfulLogin(String clientIp, Instant occurredAt) {
        return new UserAccount(
                employeeNo,
                userName,
                loginId,
                userPassword,
                useYn,
                groupCode,
                deptCode,
                occurredAt,
                clientIp,
                passwordResetDt,
                passwordReset,
                picYn,
                0,
                email,
                lastChangedAt,
                lastChangedId
        );
    }

    public UserAccount recordFailedLogin() {
        return new UserAccount(
                employeeNo,
                userName,
                loginId,
                userPassword,
                useYn,
                groupCode,
                deptCode,
                loginDt,
                recentIpAddr,
                passwordResetDt,
                passwordReset,
                picYn,
                wrongPasswordCount + 1,
                email,
                lastChangedAt,
                lastChangedId
        );
    }

    public UserAccount resetPassword(String encodedPassword, String resetDate, Instant occurredAt, String actorId) {
        return new UserAccount(
                employeeNo,
                userName,
                loginId,
                encodedPassword,
                useYn,
                groupCode,
                deptCode,
                loginDt,
                recentIpAddr,
                resetDate,
                true,
                picYn,
                0,
                email,
                occurredAt,
                actorId
        );
    }

    public UserAccount changePassword(String encodedPassword, String resetDate, Instant occurredAt, String actorId) {
        return new UserAccount(
                employeeNo,
                userName,
                loginId,
                encodedPassword,
                useYn,
                groupCode,
                deptCode,
                loginDt,
                recentIpAddr,
                resetDate,
                false,
                picYn,
                0,
                email,
                occurredAt,
                actorId
        );
    }
}
