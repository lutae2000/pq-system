package com.cheil.cheil_be.adapter.in.web.newemployment;

public record NewEmploymentEmployeeRequest(
        String baseYearMonth,
        String employeeNo,
        String employeeName,
        String birthDate,
        String hireDate,
        String departmentCode,
        String jobCategory,
        String remark
) {
    com.cheil.cheil_be.application.newemployment.model.NewEmploymentEmployeeCommand toCommand() {
        return new com.cheil.cheil_be.application.newemployment.model.NewEmploymentEmployeeCommand(
                baseYearMonth, employeeNo, employeeName, birthDate, hireDate,
                departmentCode, jobCategory, remark
        );
    }
}
