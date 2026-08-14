package com.cheil.cheil_be.application.userauth.port.in;

public record SignupResult(
        String employeeNo,
        String loginId,
        String userName,
        String groupCode,
        String deptCode,
        boolean useYn
) {
}
