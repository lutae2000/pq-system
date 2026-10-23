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
    static NewEmploymentEmployeeResponse from(
            com.cheil.cheil_be.application.newemployment.model.NewEmploymentEmployee employee
    ) {
        return new NewEmploymentEmployeeResponse(
                employee.id(), employee.baseYearMonth(), employee.employeeNo(), employee.employeeName(),
                employee.birthDate(), employee.hireDate(), employee.departmentCode(), employee.departmentName(),
                employee.jobCategory(), employee.remark(), employee.createdAt(), employee.createdId(),
                employee.lastChangedAt(), employee.lastChangedId()
        );
    }
}
