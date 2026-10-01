package com.cheil.cheil_be.application.newtechnology.model;

import java.math.BigDecimal;
import java.time.Instant;

/** 신기술 활용 실적 조회 결과입니다. 웹 응답 DTO는 이 모델을 변환해서 사용합니다. */
public record NewTechnologyUsageView(
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
