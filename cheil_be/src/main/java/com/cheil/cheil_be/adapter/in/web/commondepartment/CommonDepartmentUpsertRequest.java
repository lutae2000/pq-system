package com.cheil.cheil_be.adapter.in.web.commondepartment;

import com.cheil.cheil_be.application.commondepartment.port.in.CommonDepartmentUpsertCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommonDepartmentUpsertRequest(
        @NotBlank @Size(max = 20) String deptCode,
        @NotBlank @Size(max = 100) String deptName,
        @NotBlank @Size(max = 10) String deptDiv,
        @NotBlank @Size(max = 10) String projDiv,
        Boolean useYn,
        String terminateDate,
        @NotBlank @Size(max = 20) String headquarterCode,
        @Size(max = 20) String inputDutyId,
        @Size(max = 20) String chgDutyId,
        @NotBlank @Size(max = 10) String sortSeq,
        Boolean mhYn,
        @Size(max = 20) String costDept
) {

    public CommonDepartmentUpsertCommand toCommand() {
        return new CommonDepartmentUpsertCommand(
                deptCode, deptName, deptDiv, projDiv, useYn, terminateDate,
                headquarterCode, inputDutyId, chgDutyId, sortSeq, mhYn, costDept
        );
    }
}
