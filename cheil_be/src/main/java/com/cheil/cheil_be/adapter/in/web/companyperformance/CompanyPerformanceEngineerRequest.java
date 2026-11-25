package com.cheil.cheil_be.adapter.in.web.companyperformance;

import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceEngineerCommand;
import jakarta.validation.constraints.Positive;

public record CompanyPerformanceEngineerRequest(
        String engineerId,
        String participationStartDate,
        String participationEndDate,
        @Positive Long contractPeriodId,
        String jobTag,
        String participationFieldPosition,
        String actualParticipationYn,
        String reportYn,
        String companyAtParticipation,
        String departmentAtParticipation,
        String positionAtParticipation,
        String duty,
        String jobField,
        String specialtyField,
        String remark
) {
    CompanyPerformanceEngineerCommand toCommand() {
        return new CompanyPerformanceEngineerCommand(
                engineerId,
                participationStartDate,
                participationEndDate,
                contractPeriodId,
                jobTag,
                participationFieldPosition,
                actualParticipationYn,
                reportYn,
                companyAtParticipation,
                departmentAtParticipation,
                positionAtParticipation,
                duty,
                jobField,
                specialtyField,
                remark
        );
    }
}
