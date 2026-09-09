package com.cheil.cheil_be.adapter.in.web.workoverlap.contract;

public record WorkOverlapContractEngineerChangeRequest(
        String beforeEngineerId,
        String afterEngineerId,
        String changeContent,
        String field,
        String participationDate,
        String participationType,
        Boolean pqTargetYn,
        String remark
) {
}
