package com.cheil.cheil_be.adapter.in.web.newtechnology;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyDevelopmentCommand;

public record NewTechnologyDevelopmentRequest(
        @NotBlank @Size(max = 500) String title,
        @Size(max = 100) String technologyType,
        @Positive BigDecimal applicantCount,
        @PositiveOrZero BigDecimal calculatedScore,
        String applicationDate,
        @Size(max = 100) String targetField,
        @Size(max = 100) String applicationNo,
        @Size(max = 100) String registrationNo,
        String validUntil,
        String summary,
        String remark,
        Boolean useYn
) {
    public NewTechnologyDevelopmentCommand toCommand() {
        return new NewTechnologyDevelopmentCommand(title, technologyType, applicantCount, calculatedScore,
                applicationDate, targetField, applicationNo, registrationNo, validUntil, summary, remark, useYn);
    }
}
