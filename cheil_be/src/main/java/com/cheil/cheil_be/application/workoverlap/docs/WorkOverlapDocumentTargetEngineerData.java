package com.cheil.cheil_be.application.workoverlap.docs;

public record WorkOverlapDocumentTargetEngineerData(
        Long targetId,
        Long bidSeq,
        String workDutyId,
        String engineerId,
        Integer displayOrder,
        String responsibility,
        String engineerName,
        String birthday,
        String departmentName,
        String grade,
        String dutyPart,
        String projectPart,
        String retireYn
) {
}
