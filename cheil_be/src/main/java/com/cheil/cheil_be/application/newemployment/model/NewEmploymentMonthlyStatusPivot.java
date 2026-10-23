package com.cheil.cheil_be.application.newemployment.model;

import java.math.BigDecimal;

public record NewEmploymentMonthlyStatusPivot(
        String yearMonth,
        BigDecimal employeeCount,
        BigDecimal newHireCount
) {
}
