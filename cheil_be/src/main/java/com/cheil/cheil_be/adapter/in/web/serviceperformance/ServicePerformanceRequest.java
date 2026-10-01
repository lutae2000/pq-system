package com.cheil.cheil_be.adapter.in.web.serviceperformance;

import java.math.BigDecimal;

import com.cheil.cheil_be.application.serviceperformance.port.in.ServicePerformanceCommand;

public record ServicePerformanceRequest(
        String clientCode,
        String fieldName,
        String siteName,
        String evaluationDate,
        BigDecimal serviceAmount,
        BigDecimal evaluationScore,
        String remark
) {
    ServicePerformanceCommand toCommand() {
        return new ServicePerformanceCommand(
                clientCode, fieldName, siteName, evaluationDate,
                serviceAmount, evaluationScore, remark
        );
    }
}
