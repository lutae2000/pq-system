package com.cheil.cheil_be.application.bidnotice.port.in;

import java.time.LocalDate;

public record BidNoticeSearchCondition(
        String keyword,
        String departmentCode,
        String superDecideEmpno,
        String bidType,
        String businessType,
        String fieldOfWorkCode,
        String scopeOfWorkCode,
        LocalDate bidClosingDateFrom,
        LocalDate bidClosingDateTo,
        LocalDate bidDateFrom,
        LocalDate bidDateTo,
        LocalDate pqSubmitDateFrom,
        LocalDate pqSubmitDateTo,
        String bidSuccessYn
) {
}
