package com.cheil.cheil_be.adapter.in.web.serviceperformance;

import java.math.BigDecimal;

public record ServicePerformanceRequest(
        String clientCode,
        String fieldName,
        String siteName,
        String evaluationDate,
        BigDecimal serviceAmount,
        BigDecimal evaluationScore,
        String remark
) {
}
