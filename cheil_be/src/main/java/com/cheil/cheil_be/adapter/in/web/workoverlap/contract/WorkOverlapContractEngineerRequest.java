package com.cheil.cheil_be.adapter.in.web.workoverlap.contract;

public record WorkOverlapContractEngineerRequest(
        String engineerId,
        String field,
        String participationDate,
        String participationType,
        Boolean pqTargetYn,
        String remark
) {
}
