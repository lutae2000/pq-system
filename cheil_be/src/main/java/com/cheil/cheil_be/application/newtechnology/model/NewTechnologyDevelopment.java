package com.cheil.cheil_be.application.newtechnology.model;

import java.math.BigDecimal;
import java.time.Instant;

public record NewTechnologyDevelopment(
        Long id,
        String title,
        String technologyType,
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
