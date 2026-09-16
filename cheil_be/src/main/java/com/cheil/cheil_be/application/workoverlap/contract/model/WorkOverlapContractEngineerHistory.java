package com.cheil.cheil_be.application.workoverlap.contract.model;

public record WorkOverlapContractEngineerHistory(
        Long id,
        String changedAt,
        String beforeEngineerId,
        String beforeEngineerName,
        String afterEngineerId,
        String afterEngineerName,
        String changeContent
) {
}
