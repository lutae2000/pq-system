package com.cheil.cheil_be.adapter.in.web.workoverlap.docs;

public record WorkOverlapDocumentTargetResponse(
        Long targetId,
        Long bidSeq,
        String workDutyId,
        String engineerId,
        String contractNo,
        Integer displayOrder,
        String responsibility
) {
}
