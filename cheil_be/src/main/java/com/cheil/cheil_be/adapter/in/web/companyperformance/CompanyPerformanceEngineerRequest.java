package com.cheil.cheil_be.adapter.in.web.companyperformance;

public record CompanyPerformanceEngineerRequest(
        String engineerId,
        String participationStartDate,
        String participationEndDate,
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
