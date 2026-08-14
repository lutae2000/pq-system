package com.cheil.cheil_be.adapter.in.web.companyperformance;

import java.math.BigDecimal;

import com.cheil.cheil_be.application.companyperformance.port.in.CompanyPerformanceUpsertCommand;

public record CompanyPerformanceUpsertRequest(
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
    public CompanyPerformanceUpsertCommand toCommand() {
        return new CompanyPerformanceUpsertCommand(
                jobSeq,
                jobName,
                jobOwnYn,
                generalManagementYn,
                contractFromDate,
                contractToDate,
                jobFinishYn,
                stopDate,
                summary,
                jobType,
                jobRatio,
                contractAmt,
                ownAmt,
                orderClient,
                remark,
                divisionRate,
                clientKind,
                businessType,
                overseeYn,
                createdId,
                lastChangedId
        );
    }
}
