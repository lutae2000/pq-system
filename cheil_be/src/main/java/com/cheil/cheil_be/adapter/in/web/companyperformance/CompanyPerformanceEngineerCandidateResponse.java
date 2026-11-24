package com.cheil.cheil_be.adapter.in.web.companyperformance;

import com.cheil.cheil_be.application.engineer.EngineerCandidate;

public record CompanyPerformanceEngineerCandidateResponse(
        String engineerId,
        String name,
        String birthDate,
        String department,
        String position,
        String dutyPart,
        String proPart,
        String designGrade
) {
    static CompanyPerformanceEngineerCandidateResponse from(EngineerCandidate candidate) {
        return new CompanyPerformanceEngineerCandidateResponse(
                candidate.engineerId(), candidate.name(), candidate.birthDate(), candidate.department(),
                candidate.position(), candidate.dutyPart(), candidate.proPart(), candidate.designGrade());
    }
}
