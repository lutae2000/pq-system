package com.cheil.cheil_be.adapter.in.web.pqparticipatingengineer;

import com.cheil.cheil_be.application.pqparticipatingengineer.model.CandidateEngineer;

public record PqParticipatingEngineerCandidateResponse(
        String engrId,
        String name,
        String birthDate,
        String department,
        String position,
        String jobField,
        String specialtyField,
        String designGrade,
        String constructionManagementGrade,
        String retireYn
) {
    static PqParticipatingEngineerCandidateResponse from(CandidateEngineer candidate) {
        return new PqParticipatingEngineerCandidateResponse(candidate.engrId(), candidate.name(), candidate.birthDate(),
                candidate.department(), candidate.position(), candidate.jobField(), candidate.specialtyField(),
                candidate.designGrade(), candidate.constructionManagementGrade(), candidate.retireYn());
    }
}
