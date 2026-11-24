package com.cheil.cheil_be.application.companyperformance.model;

public record CompanyPerformanceEngineerCommand(
        String engineerId,
        String participationStartDate,
        String participationEndDate,
        Long contractPeriodId,
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
}
