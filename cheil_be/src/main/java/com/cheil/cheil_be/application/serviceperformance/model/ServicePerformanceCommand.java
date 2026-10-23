package com.cheil.cheil_be.application.serviceperformance.model;

import java.math.BigDecimal;

public record ServicePerformanceCommand(
        String clientCode,
        String fieldName,
        String siteName,
        String evaluationDate,
        BigDecimal serviceAmount,
        BigDecimal evaluationScore,
        String remark
) {
}
