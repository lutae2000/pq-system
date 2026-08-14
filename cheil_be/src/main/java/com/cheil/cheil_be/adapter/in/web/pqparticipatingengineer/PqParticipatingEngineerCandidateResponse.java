package com.cheil.cheil_be.adapter.in.web.pqparticipatingengineer;

public record PqParticipatingEngineerCandidateResponse(
        String engrId,
        String name,
        String department,
        String position,
        String jobField,
        String specialtyField,
        String designGrade,
        String constructionManagementGrade,
        String retireYn
) {
}
