package com.cheil.cheil_be.adapter.in.web.companyperformance;

import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceEngineerCommand;
import jakarta.validation.constraints.Positive;

public record CompanyPerformanceEngineerRequest(
        String engineerId,
        String participationStartDate,
        String participationEndDate,
        @Positive Long contractPeriodId,
        String category,
        String participationFieldPosition,
        String actualParticipationYn,
        String reportYn,
        Integer participationGrade,
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
                category,
                participationFieldPosition,
                actualParticipationYn,
                reportYn,
                participationGrade,
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
