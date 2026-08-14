package com.cheil.cheil_be.application.companyperformance.port.in;

import java.math.BigDecimal;

public record CompanyPerformanceUpsertCommand(
        Long jobSeq,
        String jobName,
        Boolean jobOwnYn,
        Boolean generalManagementYn,
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
        Boolean overseeYn,
        String createdId,
        String lastChangedId
) {
}
