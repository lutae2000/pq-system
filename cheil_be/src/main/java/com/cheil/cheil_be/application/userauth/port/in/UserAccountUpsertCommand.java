package com.cheil.cheil_be.application.userauth.port.in;

public record UserAccountUpsertCommand(
        String employeeNo,
        String userName,
        String loginId,
        String userPassword,
        Boolean useYn,
        String groupCode,
        String deptCode,
        String loginDt,
        String recentIpAddr,
        String passwordResetDt,
        Boolean passwordReset,
        String picYn,
        Integer wrongPasswordCount,
        String email,
        String lastChangedId
) {
}
