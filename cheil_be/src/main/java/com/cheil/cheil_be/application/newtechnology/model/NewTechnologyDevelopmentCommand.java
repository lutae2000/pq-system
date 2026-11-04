package com.cheil.cheil_be.application.newtechnology.model;

import java.math.BigDecimal;

public record NewTechnologyDevelopmentCommand(
        String sequenceLabel,
        String title,
        String technologyType,
        String workCategory,
        BigDecimal applicantCount,
        BigDecimal calculatedScore,
        String applicationDate,
        String targetField,
        String applicationNo,
        String registrationNo,
        String validUntil,
        String summary,
        String remark,
        Boolean useYn
) {
}
