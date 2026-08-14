package com.cheil.cheil_be.adapter.in.web.userauth;

import com.cheil.cheil_be.application.userauth.port.in.SignupCommand;
import com.cheil.cheil_be.common.web.RequestValues;

public record SignupRequest(
        String employeeNo,
        String userName,
        String loginId,
        String userPassword,
        String deptCode,
        String groupCode
) {

    public SignupRequest {
        employeeNo = RequestValues.maxLength(employeeNo, 20, "사번");
        userName = RequestValues.requiredMaxLength(userName, 100, "사용자명");
        loginId = RequestValues.requiredMaxLength(loginId, 100, "로그인 ID");
        userPassword = RequestValues.required(userPassword, "비밀번호");
        deptCode = RequestValues.requiredMaxLength(deptCode, 20, "부서 코드");
        groupCode = RequestValues.requiredMaxLength(groupCode, 20, "그룹 코드");
    }

    public SignupCommand toCommand() {
        return new SignupCommand(
                employeeNo,
                userName,
                loginId,
                userPassword,
                deptCode,
                groupCode
        );
    }
}
