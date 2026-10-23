package com.cheil.cheil_be.adapter.in.web.serviceperformance;

import java.math.BigDecimal;

import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ServicePerformanceRequest(
        @NotBlank(message = "clientCode는 필수입니다.")
        String clientCode,
        @NotBlank(message = "fieldName은 필수입니다.")
        String fieldName,
        @NotBlank(message = "siteName은 필수입니다.")
        String siteName,
        @NotBlank(message = "evaluationDate는 필수입니다.")
        @Pattern(regexp = "(?:\\d{8}|\\d{4}-\\d{2}-\\d{2})", message = "evaluationDate 형식이 올바르지 않습니다.")
        String evaluationDate,
        BigDecimal serviceAmount,
        BigDecimal evaluationScore,
        @Size(max = 1000, message = "remark는 1000자 이하로 입력해야 합니다.")
        String remark
) {
    ServicePerformanceCommand toCommand() {
        return new ServicePerformanceCommand(
                clientCode, fieldName, siteName, evaluationDate,
                serviceAmount, evaluationScore, remark
        );
    }
}
