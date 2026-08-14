package com.cheil.cheil_be.adapter.in.web.userauth;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import com.cheil.cheil_be.domain.userauth.UserAccount;

public record UserAccountResponse(
        String employeeNo,
        String userName,
        String loginId,
        boolean useYn,
        String groupCode,
        String deptCode,
        String loginDt,
        String recentIpAddr,
        String passwordResetDt,
        boolean passwordReset,
        String picYn,
        int wrongPasswordCount,
        String email,
        String lastChangedAt,
        String lastChangedId
) {
    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.systemDefault());

    public static UserAccountResponse from(UserAccount userAccount) {
        return new UserAccountResponse(
                userAccount.employeeNo(),
                userAccount.userName(),
                userAccount.loginId(),
                userAccount.useYn(),
                userAccount.groupCode(),
                userAccount.deptCode(),
                format(userAccount.loginDt()),
                userAccount.recentIpAddr(),
                userAccount.passwordResetDt(),
                userAccount.passwordReset(),
                userAccount.picYn() ? "Y" : "N",
                userAccount.wrongPasswordCount(),
                userAccount.email(),
                format(userAccount.lastChangedAt()),
                userAccount.lastChangedId()
        );
    }

    private static String format(java.time.Instant value) {
        return value == null ? "" : FORMATTER.format(value);
    }
}
