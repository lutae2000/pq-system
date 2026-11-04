package com.cheil.cheil_be.application.newtechnology.model;

import java.math.BigDecimal;
import java.time.Instant;

public record NewTechnologyDevelopment(
        Long id,
        String sequenceLabel,
        String title,
        String technologyType,
        String workCategory,
        BigDecimal applicantCount,
        boolean useYn,
        String applicationDate,
        BigDecimal calculatedScore,
        String targetField,
        String applicationNo,
        String registrationNo,
        String validUntil,
        String summary,
        String remark,
        Instant createdAt,
        String createdId,
        Instant lastChangedAt,
        String lastChangedId
) {
}
