package com.cheil.cheil_be.adapter.in.web.newemployment;

public record NewEmploymentMonthlyStatusRequest(
        String baseYearMonth,
        Integer employeeCount,
        Integer newHireCount
) {
    com.cheil.cheil_be.application.newemployment.model.NewEmploymentMonthlyStatusCommand toCommand() {
        return new com.cheil.cheil_be.application.newemployment.model.NewEmploymentMonthlyStatusCommand(
                baseYearMonth, employeeCount, newHireCount
        );
    }
}
