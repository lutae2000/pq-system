package com.cheil.cheil_be.adapter.in.web.workoverlap.contract;

import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerChangeCommand;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record WorkOverlapContractEngineerChangeRequest(
        String beforeEngineerId,
        String afterEngineerId,
        String changeContent,
        @Size(max = 100) String historyField,
        @Size(max = 100) String historyParticipationType,
        @Pattern(regexp = "|[0-9]{8}|[0-9]{4}-[0-9]{2}-[0-9]{2}") String historyParticipationStartDate,
        @Pattern(regexp = "|[0-9]{8}|[0-9]{4}-[0-9]{2}-[0-9]{2}") String historyParticipationEndDate,
        @Size(max = 100) String field,
        String participationDate,
        @Pattern(regexp = "|[0-9]{8}|[0-9]{4}-[0-9]{2}-[0-9]{2}") String participationEndDate,
        @Size(max = 100) String participationType,
        Boolean pqTargetYn,
        String remark
) {
    public WorkOverlapContractEngineerChangeCommand toCommand() {
        return new WorkOverlapContractEngineerChangeCommand(
                beforeEngineerId, afterEngineerId, changeContent,
                historyField, historyParticipationType,
                historyParticipationStartDate, historyParticipationEndDate,
                field, participationDate, participationEndDate, participationType, pqTargetYn, remark
        );
    }
}
