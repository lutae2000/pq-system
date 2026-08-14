package com.cheil.cheil_be.adapter.in.web.newemployment;

import java.time.Instant;

public record NewEmploymentMonthlyStatusResponse(
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
