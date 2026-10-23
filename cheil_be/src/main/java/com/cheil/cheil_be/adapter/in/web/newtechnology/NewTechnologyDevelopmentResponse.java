package com.cheil.cheil_be.adapter.in.web.newtechnology;

import java.math.BigDecimal;
import java.time.Instant;

import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyDevelopmentView;

public record NewTechnologyDevelopmentResponse(
        Long id,
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
    public static NewTechnologyDevelopmentResponse from(NewTechnologyDevelopmentView view) {
        return new NewTechnologyDevelopmentResponse(view.id(), view.title(), view.technologyType(),
                view.applicantCount(), view.useYn(), view.applicationDate(), view.elapsedYears(),
                view.calculatedScore(), view.targetField(), view.applicationNo(), view.registrationNo(),
                view.validUntil(), view.summary(), view.remark(), view.createdAt(), view.createdId(),
                view.lastChangedAt(), view.lastChangedId());
    }
}
