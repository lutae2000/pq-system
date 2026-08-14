package com.cheil.cheil_be.adapter.in.web.pqparticipatingengineer;

public record PqParticipatingEngineerResponse(
        Long bidSeq,
        String engrId,
        String workDutyId,
        Integer priority,
        String role,
        String memo,
        String name,
        String department,
        String position,
        String jobField,
        String specialtyField,
        String retireYn
) {
}
