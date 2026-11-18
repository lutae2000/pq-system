package com.cheil.cheil_be.application.bidnotice.model;

import java.math.BigDecimal;

public record BidNoticeDepartmentSummary(
        String departmentCode,
        String departmentName,
        long bidCount,
        long successCount,
        BigDecimal designAmount
) {
}
