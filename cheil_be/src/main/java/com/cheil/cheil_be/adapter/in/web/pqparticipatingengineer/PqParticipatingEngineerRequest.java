package com.cheil.cheil_be.adapter.in.web.pqparticipatingengineer;

public record PqParticipatingEngineerRequest(
        Long bidSeq,
        String engrId,
        String workDutyId,
        Integer priority,
        String responsibility,
        String role,
        String memo
) {
}
