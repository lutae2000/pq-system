package com.cheil.cheil_be.application.userauth.port.in;

public record LoginResult(
        String employeeNo,
        String loginId,
        String userName,
        String groupCode,
        String deptCode,
        boolean useYn,
        java.time.Instant loginDt,
        String recentIpAddr,
        boolean passwordReset,
        LoginSessionResult session
) {
}
