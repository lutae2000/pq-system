package com.cheil.cheil_be.adapter.in.web.companyperformance;

import java.math.BigDecimal;

import com.cheil.cheil_be.domain.companyperformance.CompanyPerformance;

public record CompanyPerformanceResponse(
        Long seq,
        Long jobSeq,
        String jobName,
        boolean jobOwnYn,
        boolean generalManagementYn,
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
        boolean overseeYn,
        String createdAt,
        String createdId,
        String lastChangedAt,
        String lastChangedId
) {
    public static CompanyPerformanceResponse from(CompanyPerformance companyPerformance) {
        return new CompanyPerformanceResponse(
                companyPerformance.seq(),
                companyPerformance.jobSeq(),
                companyPerformance.jobName(),
                "Y".equals(companyPerformance.jobOwnYn()),
                "Y".equals(companyPerformance.generalManagement()),
                companyPerformance.contractFromDate(),
                companyPerformance.contractToDate(),
                companyPerformance.jobFinishYn(),
                companyPerformance.stopDate(),
                companyPerformance.summary(),
                companyPerformance.jobType(),
                companyPerformance.jobRatio(),
                companyPerformance.contractAmt(),
                companyPerformance.ownAmt(),
                companyPerformance.orderClient(),
                companyPerformance.remark(),
                companyPerformance.divisionRate(),
                companyPerformance.clientKind(),
                companyPerformance.businessType(),
                "Y".equals(companyPerformance.overseeYn()),
                companyPerformance.createdAt() == null ? null : companyPerformance.createdAt().toString(),
                companyPerformance.createdId(),
                companyPerformance.lastChangedAt() == null ? null : companyPerformance.lastChangedAt().toString(),
                companyPerformance.lastChangedId()
        );
    }
}
