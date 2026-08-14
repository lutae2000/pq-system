package com.cheil.cheil_be.adapter.in.web.userauth;

import com.cheil.cheil_be.application.userauth.port.in.SignupResult;

public record SignupResponse(
        String employeeNo,
        String loginId,
        String userName,
        String groupCode,
        String deptCode,
        boolean useYn
) {

    static SignupResponse from(SignupResult result) {
        return new SignupResponse(
                result.employeeNo(),
                result.loginId(),
                result.userName(),
                result.groupCode(),
                result.deptCode(),
                result.useYn()
        );
    }
}
