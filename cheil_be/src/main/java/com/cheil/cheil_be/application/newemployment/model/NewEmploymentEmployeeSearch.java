package com.cheil.cheil_be.application.newemployment.model;

public record NewEmploymentEmployeeSearch(
        String selectedYearMonth,
        String departmentCode,
        String employeeName
) {
}
