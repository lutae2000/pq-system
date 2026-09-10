package com.cheil.cheil_be.adapter.in.web.workoverlap.docs;

public record WorkOverlapDocumentEngineerUpdateRequest(
        Long bidSeq,
        String workDutyId,
        String engrId,
        Integer displayOrder,
        String responsibility
) {
}
