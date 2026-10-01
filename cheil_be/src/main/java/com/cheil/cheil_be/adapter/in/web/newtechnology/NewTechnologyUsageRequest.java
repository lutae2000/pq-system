package com.cheil.cheil_be.adapter.in.web.newtechnology;

import java.math.BigDecimal;

import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyUsageCommand;

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
    public NewTechnologyUsageCommand toCommand() {
        return new NewTechnologyUsageCommand(designationNo, title, developers, projectName, client, noticeDate,
                usageExpirationDate, usageCount, amountThousand, score, summary, weight,
                disasterPreventionScore, remark);
    }
}
