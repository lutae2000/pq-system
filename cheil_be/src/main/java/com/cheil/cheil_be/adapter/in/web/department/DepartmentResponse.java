package com.cheil.cheil_be.adapter.in.web.department;

import java.time.format.DateTimeFormatter;

import com.cheil.cheil_be.domain.department.Department;

public record DepartmentResponse(
        String deptCode,
        String deptName,
        String deptDiv,
        String projDiv,
        boolean useYn,
        String terminateDate,
        String headquarterCode,
        String inputDutyId,
        String inputDate,
        String chgDutyId,
        String chgDate,
        String sortSeq,
        boolean mhYn,
        String costDept
) {
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static DepartmentResponse from(Department department) {
        return new DepartmentResponse(
                department.deptCode(),
                department.deptName(),
                department.deptDiv(),
                department.projDiv(),
                department.useYn(),
                department.terminateDate() == null ? null : department.terminateDate().format(DATE_FORMATTER),
                department.headquarterCode(),
                department.inputDutyId(),
                department.inputDate() == null ? null : department.inputDate().atZone(java.time.ZoneId.systemDefault()).format(DATETIME_FORMATTER),
                department.chgDutyId(),
                department.chgDate() == null ? null : department.chgDate().atZone(java.time.ZoneId.systemDefault()).format(DATETIME_FORMATTER),
                department.sortSeq(),
                department.mhYn(),
                department.costDept()
        );
    }
}
