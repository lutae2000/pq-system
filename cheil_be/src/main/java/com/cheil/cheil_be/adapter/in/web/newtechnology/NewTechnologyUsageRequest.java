package com.cheil.cheil_be.adapter.in.web.newtechnology;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyUsageCommand;

public record NewTechnologyUsageRequest(
        @NotBlank @Size(max = 100) String designationNo,
        @NotBlank @Size(max = 500) String title,
        String developers,
        String projectName,
        @Size(max = 300) String client,
        String noticeDate,
        String usageExpirationDate,
        @PositiveOrZero Integer usageCount,
        @PositiveOrZero BigDecimal amountThousand,
        @PositiveOrZero BigDecimal score,
        String summary,
        @PositiveOrZero BigDecimal weight,
        @PositiveOrZero BigDecimal disasterPreventionScore,
        String remark
) {
    public NewTechnologyUsageCommand toCommand() {
        return new NewTechnologyUsageCommand(designationNo, title, developers, projectName, client, noticeDate,
                usageExpirationDate, usageCount, amountThousand, score, summary, weight,
                disasterPreventionScore, remark);
    }
}
