package com.cheil.cheil_be.adapter.in.web.newtechnology;

import java.math.BigDecimal;
import java.time.Instant;

public record NewTechnologyUsageResponse(
        Long id,
        String designationNo,
        String title,
        String developers,
        String projectName,
        String client,
        String noticeDate,
        String usageExpirationDate,
        Integer usageCount,
        BigDecimal amountThousand,
        BigDecimal score,
        String summary,
        BigDecimal weight,
        BigDecimal disasterPreventionScore,
        String remark,
        Instant createdAt,
        String createdId,
        Instant lastChangedAt,
        String lastChangedId
) {
}
