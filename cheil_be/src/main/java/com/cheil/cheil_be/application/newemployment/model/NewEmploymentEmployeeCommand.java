package com.cheil.cheil_be.application.newemployment.model;

public record NewEmploymentEmployeeCommand(
        String baseYearMonth,
        String employeeNo,
        String employeeName,
        String birthDate,
        String hireDate,
        String departmentCode,
        String jobCategory,
        String remark
) {
}
