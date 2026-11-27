package com.cheil.cheil_be.application.workoverlap.contract.model;

public record WorkOverlapContractEngineerHistorySaveCommand(
        String contractNo,
        String beforeEngineerId,
        String afterEngineerId,
        String changeContent,
        WorkOverlapContractEngineerParticipation beforeParticipation,
        WorkOverlapContractEngineerParticipation afterParticipation,
        String actor
) {
}
