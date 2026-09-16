package com.cheil.cheil_be.application.workoverlap.contract.model;

public record WorkOverlapContractEngineer(
        String engineerId,
        String name,
        String birthDate,
        String field,
        String participationDate,
        String participationType,
        Boolean pqTargetYn,
        String remark
) {
}
