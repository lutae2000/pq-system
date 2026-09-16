package com.cheil.cheil_be.adapter.in.web.workoverlap.docs;

import com.cheil.cheil_be.application.workoverlap.docs.WorkOverlapDocumentTargetEngineerData;

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
    public static WorkOverlapDocumentTargetEngineerResponse from(
            WorkOverlapDocumentTargetEngineerData data
    ) {
        return new WorkOverlapDocumentTargetEngineerResponse(
                data.targetId(),
                data.bidSeq(),
                data.workDutyId(),
                data.engineerId(),
                data.displayOrder(),
                data.responsibility(),
                data.engineerName(),
                data.birthday(),
                data.departmentName(),
                data.grade(),
                data.dutyPart(),
                data.projectPart(),
                data.retireYn()
        );
    }
}
