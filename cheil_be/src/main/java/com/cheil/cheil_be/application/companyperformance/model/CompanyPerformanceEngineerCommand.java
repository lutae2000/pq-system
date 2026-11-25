package com.cheil.cheil_be.application.companyperformance.model;

public record CompanyPerformanceEngineerCommand(
        String engineerId,
        String participationStartDate,
        String participationEndDate,
        Long contractPeriodId,
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
}
