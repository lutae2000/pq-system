package com.cheil.cheil_be.adapter.in.web.newemployment;

import java.time.Instant;

public record NewEmploymentEmployeeResponse(
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
