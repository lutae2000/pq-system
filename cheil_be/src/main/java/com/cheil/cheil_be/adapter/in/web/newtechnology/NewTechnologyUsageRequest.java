package com.cheil.cheil_be.adapter.in.web.newtechnology;

import java.math.BigDecimal;

public record NewTechnologyUsageRequest(
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
        String remark
) {
}
