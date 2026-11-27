package com.cheil.cheil_be.adapter.in.web.workoverlap.contract;

import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerHistory;

public record WorkOverlapContractEngineerHistoryResponse(
        Long id,
        String changedAt,
        String beforeEngineerId,
        String beforeEngineerName,
        String afterEngineerId,
        String afterEngineerName,
        String beforeField,
        String beforeParticipationType,
        String beforeParticipationStartDate,
        String beforeParticipationEndDate,
        String afterField,
        String afterParticipationType,
        String afterParticipationStartDate,
        String afterParticipationEndDate,
        String changeContent
) {
    public static WorkOverlapContractEngineerHistoryResponse from(
            WorkOverlapContractEngineerHistory history
    ) {
        return new WorkOverlapContractEngineerHistoryResponse(
                history.id(),
                history.changedAt(),
                history.beforeEngineerId(),
                history.beforeEngineerName(),
                history.afterEngineerId(),
                history.afterEngineerName(),
                history.beforeParticipation().field(),
                history.beforeParticipation().participationType(),
                history.beforeParticipation().participationStartDate(),
                history.beforeParticipation().participationEndDate(),
                history.afterParticipation().field(),
                history.afterParticipation().participationType(),
                history.afterParticipation().participationStartDate(),
                history.afterParticipation().participationEndDate(),
                history.changeContent()
        );
    }
}
