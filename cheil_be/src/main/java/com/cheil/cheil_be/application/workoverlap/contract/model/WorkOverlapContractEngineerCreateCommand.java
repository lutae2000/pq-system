package com.cheil.cheil_be.application.workoverlap.contract.model;

public record WorkOverlapContractEngineerCreateCommand(
        String engineerId,
        String field,
        String participationDate,
        String participationEndDate,
        String participationType,
        Boolean pqTargetYn,
        String remark
) {
}
