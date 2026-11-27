package com.cheil.cheil_be.application.workoverlap.contract.model;

public record WorkOverlapContractEngineerChangeCommand(
        String beforeEngineerId,
        String afterEngineerId,
        String changeContent,
        String historyField,
        String historyParticipationType,
        String historyParticipationStartDate,
        String historyParticipationEndDate,
        String field,
        String participationDate,
        String participationEndDate,
        String participationType,
        Boolean pqTargetYn,
        String remark
) {
}
