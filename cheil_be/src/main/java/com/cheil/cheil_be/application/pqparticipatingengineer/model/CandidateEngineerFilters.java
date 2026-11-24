package com.cheil.cheil_be.application.pqparticipatingengineer.model;

public record CandidateEngineerFilters(
        Long bidSeq,
        String workDutyId,
        String keyword,
        String certificationName,
        String constructionManagementGrade,
        String designGrade,
        String jobField,
        String specialtyField,
        String retireYn
) {
}
