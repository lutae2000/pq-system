package com.cheil.cheil_be.domain.commondepartment;

import java.time.Instant;
import java.time.LocalDate;

/**
 * 부서 도메인 객체.
 */
public record Department(
        String deptCode,
        String deptName,
        String deptDiv,
        String projDiv,
        boolean useYn,
        LocalDate terminateDate,
        String headquarterCode,
        String inputDutyId,
        Instant inputDate,
        String chgDutyId,
        Instant chgDate,
        String sortSeq,
        boolean mhYn,
        String costDept
) {
}
