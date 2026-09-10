package com.cheil.cheil_be.adapter.in.web.workoverlap.docs;

public record WorkOverlapDocumentTargetEngineerResponse(
        Long targetId,
        Long bidSeq,
        String workDutyId,
        String engrId,
        Integer displayOrder,
        String responsibility,
        String nameKor,
        String birthday,
        String deptName,
        String grade,
        String dutyPart,
        String proPart,
        String retireYn
) {
}
