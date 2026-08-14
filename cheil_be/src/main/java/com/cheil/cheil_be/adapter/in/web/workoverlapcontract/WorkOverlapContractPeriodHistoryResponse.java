package com.cheil.cheil_be.adapter.in.web.workoverlapcontract;

public record WorkOverlapContractPeriodHistoryResponse(
        long id,
        String changedAt,
        String periodName,
        String beforeValue,
        String afterValue,
        String changeContent,
        String changeReason
) {
}
