package com.cheil.cheil_be.application.commondepartment.port.in;

public record CommonDepartmentSearchCondition(
        String keyword,
        Boolean useYn
) {
}
