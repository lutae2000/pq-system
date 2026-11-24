package com.cheil.cheil_be.adapter.in.web.companyperformance;

import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceEngineerResult;

public record CompanyPerformanceEngineerResponse(
        Long id,
        String engineerId,
        String name,
        String participationStartDate,
        String participationEndDate,
        Long contractPeriodId,
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
    static CompanyPerformanceEngineerResponse from(CompanyPerformanceEngineerResult result) {
        return new CompanyPerformanceEngineerResponse(
                result.id(),
                result.engineerId(),
                result.name(),
                result.participationStartDate(),
                result.participationEndDate(),
                result.contractPeriodId(),
                result.category(),
                result.participationFieldPosition(),
                result.actualParticipationYn(),
                result.reportYn(),
                result.participationGrade(),
                result.companyAtParticipation(),
                result.departmentAtParticipation(),
                result.positionAtParticipation(),
                result.duty(),
                result.jobField(),
                result.specialtyField(),
                result.remark()
        );
    }
}
