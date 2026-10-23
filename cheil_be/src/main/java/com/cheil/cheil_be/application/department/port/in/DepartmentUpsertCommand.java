package com.cheil.cheil_be.application.department.port.in;

import java.time.Instant;
import java.time.LocalDate;

import com.cheil.cheil_be.application.common.validation.InputValues;
import com.cheil.cheil_be.common.text.StringValues;
import com.cheil.cheil_be.domain.department.Department;

public record DepartmentUpsertCommand(
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

    public DepartmentUpsertCommand {
        deptCode = InputValues.requiredText(deptCode, 20, "deptCode");
        deptName = InputValues.requiredText(deptName, 100, "deptName");
        deptDiv = InputValues.requiredText(deptDiv, 10, "deptDiv");
        projDiv = InputValues.requiredText(projDiv, 10, "projDiv");
        terminateDate = InputValues.isoDate(terminateDate, "terminateDate", false);
        headquarterCode = InputValues.requiredText(headquarterCode, 20, "headquarterCode");
        inputDutyId = optional(inputDutyId, 20, "inputDutyId");
        chgDutyId = optional(chgDutyId, 20, "chgDutyId");
        sortSeq = InputValues.requiredText(sortSeq, 10, "sortSeq");
        costDept = optional(costDept, 20, "costDept");
    }

    public Department toDomain(Department existing, Instant now) {
        String resolvedInputDutyId = StringValues.optional(inputDutyId, existing == null ? "admin" : existing.inputDutyId());
        String resolvedChangeDutyId = StringValues.optional(chgDutyId, resolvedInputDutyId);
        return new Department(
                deptCode, deptName, deptDiv, projDiv,
                useYn == null ? existing == null || existing.useYn() : useYn,
                terminateDate == null ? null : LocalDate.parse(terminateDate),
                headquarterCode,
                resolvedInputDutyId,
                existing == null ? now : existing.inputDate(),
                resolvedChangeDutyId,
                now,
                sortSeq,
                mhYn == null ? existing != null && existing.mhYn() : mhYn,
                costDept
        );
    }

    private static String optional(String value, int maxLength, String fieldName) {
        String normalized = StringValues.trimToNull(value);
        InputValues.validateMaxLength(normalized, maxLength, fieldName);
        return normalized;
    }
}
