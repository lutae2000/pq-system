package com.cheil.cheil_be.application.newemployment.model;

import java.time.Instant;

public record NewEmploymentMonthlyStatus(
        Long id,
        String baseYearMonth,
        Integer employeeCount,
        Integer newHireCount,
        Instant createdAt,
        String createdId,
        Instant lastChangedAt,
        String lastChangedId
) {
}
