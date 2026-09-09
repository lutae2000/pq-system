package com.cheil.cheil_be.adapter.in.web.workoverlap.docs;

import java.util.List;

public record WorkOverlapDocumentTargetRequest(
        Long bidSeq,
        String workDutyId,
        String engineerId,
        List<WorkOverlapDocumentTargetItem> contracts
) {
}
