package com.cheil.cheil_be.adapter.in.web.pqparticipatingengineer;

import java.util.List;

public record ReplacePqParticipatingEngineersRequest(
        Long bidSeq,
        String workDutyId,
        List<Item> engineers
) {

    public record Item(
            String engrId,
            Integer priority,
            String responsibility,
            String role,
            String memo
    ) {
    }
}
