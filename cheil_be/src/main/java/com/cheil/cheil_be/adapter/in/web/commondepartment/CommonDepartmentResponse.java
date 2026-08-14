package com.cheil.cheil_be.adapter.in.web.commondepartment;

import java.time.format.DateTimeFormatter;

import com.cheil.cheil_be.domain.commondepartment.Department;

public record CommonDepartmentResponse(
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

    public static CommonDepartmentResponse from(Department commonDepartment) {
        return new CommonDepartmentResponse(
                commonDepartment.deptCode(),
                commonDepartment.deptName(),
                commonDepartment.deptDiv(),
                commonDepartment.projDiv(),
                commonDepartment.useYn(),
                commonDepartment.terminateDate() == null ? null : commonDepartment.terminateDate().format(DATE_FORMATTER),
                commonDepartment.headquarterCode(),
                commonDepartment.inputDutyId(),
                commonDepartment.inputDate() == null ? null : commonDepartment.inputDate().atZone(java.time.ZoneId.systemDefault()).format(DATETIME_FORMATTER),
                commonDepartment.chgDutyId(),
                commonDepartment.chgDate() == null ? null : commonDepartment.chgDate().atZone(java.time.ZoneId.systemDefault()).format(DATETIME_FORMATTER),
                commonDepartment.sortSeq(),
                commonDepartment.mhYn(),
                commonDepartment.costDept()
        );
    }
}
