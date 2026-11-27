package com.cheil.cheil_be.adapter.in.web.workoverlap.contract;

import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerCreateCommand;
import jakarta.validation.constraints.Pattern;

public record WorkOverlapContractEngineerRequest(
        String engineerId,
        String field,
        String participationDate,
        @Pattern(regexp = "|[0-9]{8}|[0-9]{4}-[0-9]{2}-[0-9]{2}") String participationEndDate,
        String participationType,
        Boolean pqTargetYn,
        String remark
) {
    public WorkOverlapContractEngineerCreateCommand toCommand() {
        return new WorkOverlapContractEngineerCreateCommand(
                engineerId, field, participationDate, participationEndDate, participationType, pqTargetYn, remark
        );
    }
}
