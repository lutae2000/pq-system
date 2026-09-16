package com.cheil.cheil_be.application.workoverlap.contract.model;

public record WorkOverlapContractEngineerSaveCommand(
        String contractNo,
        String currentEngineerId,
        String engineerId,
        String field,
        String participationDate,
        String participationType,
        boolean pqTargetYn,
        String remark,
        String actor
) {
}
