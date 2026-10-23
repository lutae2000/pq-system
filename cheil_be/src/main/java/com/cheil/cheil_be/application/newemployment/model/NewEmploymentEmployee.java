package com.cheil.cheil_be.application.newemployment.model;

import java.time.Instant;

public record NewEmploymentEmployee(
        Long id,
        String baseYearMonth,
        String employeeNo,
        String employeeName,
        String birthDate,
        String hireDate,
        String departmentCode,
        String departmentName,
        String jobCategory,
        String remark,
        Instant createdAt,
        String createdId,
        Instant lastChangedAt,
        String lastChangedId
) {
}
