package com.cheil.cheil_be.domain.companyperformance;

import java.math.BigDecimal;
import java.time.Instant;

public record CompanyPerformance(
        Long seq,
        Long jobSeq,
        String jobName,
        String jobOwnYn,
        String generalManagement,
        String contractFromDate,
        String contractToDate,
        String jobFinishYn,
        String stopDate,
        String summary,
        String jobType,
        String jobRatio,
        Long contractAmt,
        Long ownAmt,
        String orderClient,
        String remark,
        BigDecimal divisionRate,
        String clientKind,
        String businessType,
        String overseeYn,
        Instant createdAt,
        String createdId,
        Instant lastChangedAt,
        String lastChangedId
) {
}
