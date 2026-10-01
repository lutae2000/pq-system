package com.cheil.cheil_be.adapter.in.web.newtechnology;

import java.math.BigDecimal;
import java.time.Instant;

import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyUsageView;

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
    public static NewTechnologyUsageResponse from(NewTechnologyUsageView view) {
        return new NewTechnologyUsageResponse(view.id(), view.designationNo(), view.title(), view.developers(),
                view.projectName(), view.client(), view.noticeDate(), view.usageExpirationDate(), view.usageCount(),
                view.amountThousand(), view.score(), view.summary(), view.weight(), view.disasterPreventionScore(),
                view.remark(), view.createdAt(), view.createdId(), view.lastChangedAt(), view.lastChangedId());
    }
}
