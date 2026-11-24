package com.cheil.cheil_be.application.pqparticipatingengineer.model;

public record CandidateEngineer(
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
}
