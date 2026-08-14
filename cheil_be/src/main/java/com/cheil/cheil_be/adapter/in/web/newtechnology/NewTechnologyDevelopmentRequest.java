package com.cheil.cheil_be.adapter.in.web.newtechnology;

import java.math.BigDecimal;

public record NewTechnologyDevelopmentRequest(
        String sequenceLabel,
        String title,
        String technologyType,
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
