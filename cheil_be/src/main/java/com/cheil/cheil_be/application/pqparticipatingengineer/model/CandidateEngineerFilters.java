package com.cheil.cheil_be.application.pqparticipatingengineer.model;

import java.util.List;

public record CandidateEngineerFilters(
        Long bidSeq,
        String workDutyId,
        String keyword,
        String certificationName,
        String constructionManagementGrade,
        String designGrade,
        String jobField,
        String specialtyField,
        String retireYn,
        List<String> draftEngineerIds
) {
    public CandidateEngineerFilters {
        draftEngineerIds = draftEngineerIds == null ? List.of() : List.copyOf(draftEngineerIds);
    }
}
