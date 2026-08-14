package com.cheil.cheil_be.adapter.in.web.newtechnology;

import java.math.BigDecimal;
import java.time.Instant;

public record NewTechnologyDevelopmentResponse(
        Long id,
        String sequenceLabel,
        String title,
        String technologyType,
        BigDecimal applicantCount,
        boolean useYn,
        String applicationDate,
        BigDecimal elapsedYears,
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
