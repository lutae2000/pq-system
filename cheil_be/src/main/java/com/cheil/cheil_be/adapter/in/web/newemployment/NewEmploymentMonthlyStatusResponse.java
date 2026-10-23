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
    static NewEmploymentMonthlyStatusResponse from(
            com.cheil.cheil_be.application.newemployment.model.NewEmploymentMonthlyStatus status
    ) {
        return new NewEmploymentMonthlyStatusResponse(
                status.id(), status.baseYearMonth(), status.employeeCount(), status.newHireCount(),
                status.createdAt(), status.createdId(), status.lastChangedAt(), status.lastChangedId()
        );
    }
}
