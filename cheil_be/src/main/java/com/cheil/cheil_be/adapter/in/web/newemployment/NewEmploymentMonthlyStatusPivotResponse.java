package com.cheil.cheil_be.adapter.in.web.newemployment;

import java.math.BigDecimal;

public record NewEmploymentMonthlyStatusPivotResponse(
        String yearMonth,
        BigDecimal employeeCount,
        BigDecimal newHireCount
) {
}
