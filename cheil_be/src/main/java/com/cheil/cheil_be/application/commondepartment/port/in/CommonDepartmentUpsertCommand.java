package com.cheil.cheil_be.application.commondepartment.port.in;

public record CommonDepartmentUpsertCommand(
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
