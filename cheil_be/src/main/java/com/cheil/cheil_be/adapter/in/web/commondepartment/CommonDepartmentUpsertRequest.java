package com.cheil.cheil_be.adapter.in.web.commondepartment;

public record CommonDepartmentUpsertRequest(
        String deptCode,
        String deptName,
        String deptDiv,
        String projDiv,
        Boolean useYn,
        String terminateDate,
        String headquarterCode,
        String inputDutyId,
        String chgDutyId,
        String sortSeq,
        Boolean mhYn,
        String costDept
) {
}
