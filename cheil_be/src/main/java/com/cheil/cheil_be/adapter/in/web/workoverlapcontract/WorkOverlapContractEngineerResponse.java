package com.cheil.cheil_be.adapter.in.web.workoverlapcontract;

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
}
