package com.cheil.cheil_be.adapter.in.web.companyperformance;

public record CompanyPerformanceEngineerResponse(
        Long id,
        String engineerId,
        String name,
        String participationStartDate,
        String participationEndDate,
        String category,
        String participationFieldPosition,
        String actualParticipationYn,
        String reportYn,
        String participationGrade,
        String companyAtParticipation,
        String departmentAtParticipation,
        String positionAtParticipation,
        String duty,
        String jobField,
        String specialtyField,
        String remark
) {
}
