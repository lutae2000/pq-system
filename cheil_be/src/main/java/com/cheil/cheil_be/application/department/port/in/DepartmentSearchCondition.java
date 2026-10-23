package com.cheil.cheil_be.application.department.port.in;

public record DepartmentSearchCondition(
        String keyword,
        Boolean useYn
) {
}
