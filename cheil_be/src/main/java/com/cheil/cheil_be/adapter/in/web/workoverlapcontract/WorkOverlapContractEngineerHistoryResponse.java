package com.cheil.cheil_be.adapter.in.web.workoverlapcontract;

public record WorkOverlapContractEngineerHistoryResponse(
        Long id,
        String changedAt,
        String beforeEngineerId,
        String beforeEngineerName,
        String afterEngineerId,
        String afterEngineerName,
        String changeContent
) {
}
