package com.cheil.cheil_be.application.userauth.port.in;

public record UserAccountSearchCondition(
        String keyword,
        String useYn,
        String groupCode,
        String deptCode
) {
}
