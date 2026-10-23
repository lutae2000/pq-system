package com.cheil.cheil_be.adapter.in.web.department;

import com.cheil.cheil_be.application.department.port.in.DepartmentUpsertCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DepartmentUpsertRequest(
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

    public DepartmentUpsertCommand toCommand() {
        return new DepartmentUpsertCommand(
                deptCode, deptName, deptDiv, projDiv, useYn, terminateDate,
                headquarterCode, inputDutyId, chgDutyId, sortSeq, mhYn, costDept
        );
    }
}
