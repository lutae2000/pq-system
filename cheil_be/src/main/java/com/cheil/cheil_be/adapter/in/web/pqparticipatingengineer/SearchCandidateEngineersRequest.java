package com.cheil.cheil_be.adapter.in.web.pqparticipatingengineer;

import com.cheil.cheil_be.application.pqparticipatingengineer.model.CandidateEngineerFilters;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record SearchCandidateEngineersRequest(
        Long bidSeq,
        String workDutyId,
        String keyword,
        String certificationName,
        String constructionManagementGrade,
        String designGrade,
        String jobField,
        String specialtyField,
        String retireYn,
        String projectHistoryConditions,
        List<@NotBlank @Size(max = 20) String> draftEngineerIds
) {
    CandidateEngineerFilters toFilters() {
        return new CandidateEngineerFilters(bidSeq, workDutyId, keyword, certificationName, constructionManagementGrade,
                designGrade, jobField, specialtyField, retireYn, draftEngineerIds);
    }
}
