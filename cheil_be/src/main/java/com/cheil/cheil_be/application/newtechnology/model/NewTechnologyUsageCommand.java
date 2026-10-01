package com.cheil.cheil_be.application.newtechnology.model;

import java.math.BigDecimal;

/** 신기술 활용 실적의 입력값을 웹 계층과 분리해 전달하는 application 모델입니다. */
public record NewTechnologyUsageCommand(
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
