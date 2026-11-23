package com.cheil.cheil_be.application.bidnotice.port.in;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

import com.cheil.cheil_be.common.text.StringValues;

public record BidNoticeSearchCondition(
        String keyword,
        String orderClient,
        String orderMethod,
        String remark,
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
        String bidSuccessYn,
        List<String> participationStatuses
) {
    public BidNoticeSearchCondition {
        participationStatuses = participationStatuses == null ? List.of() : participationStatuses.stream()
                .map(StringValues::trimToNull)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }
}
