package com.cheil.cheil_be.adapter.in.web.companyperformance;

public record CompanyPerformanceEngineerCandidateResponse(
        String engineerId,
        String name,
        String department,
        String position,
        String dutyPart,
        String proPart,
        String designGrade
) {
}
