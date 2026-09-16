package com.cheil.cheil_be.adapter.in.web.workoverlap.contract;

import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineer;

public record WorkOverlapContractEngineerResponse(
        String engineerId,
        String name,
        String birthDate,
        String field,
        String participationDate,
        String participationType,
        Boolean pqTargetYn,
        String remark
) {
    public static WorkOverlapContractEngineerResponse from(WorkOverlapContractEngineer engineer) {
        return new WorkOverlapContractEngineerResponse(
                engineer.engineerId(),
                engineer.name(),
                engineer.birthDate(),
                engineer.field(),
                engineer.participationDate(),
                engineer.participationType(),
                engineer.pqTargetYn(),
                engineer.remark()
        );
    }
}
