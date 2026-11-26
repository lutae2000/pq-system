package com.cheil.cheil_be.application.companyperformance.model;

public record CompanyPerformanceEngineerResult(
        Long id,
        String engineerId,
        String name,
        String participationStartDate,
        String participationEndDate,
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
