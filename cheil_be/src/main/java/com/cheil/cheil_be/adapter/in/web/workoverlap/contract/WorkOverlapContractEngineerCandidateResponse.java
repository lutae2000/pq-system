package com.cheil.cheil_be.adapter.in.web.workoverlap.contract;

import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerCandidate;

public record WorkOverlapContractEngineerCandidateResponse(
        String engineerId,
        String name,
        String birthDate,
        String field
) {
    public static WorkOverlapContractEngineerCandidateResponse from(
            WorkOverlapContractEngineerCandidate candidate
    ) {
        return new WorkOverlapContractEngineerCandidateResponse(
                candidate.engineerId(),
                candidate.name(),
                candidate.birthDate(),
                candidate.field()
        );
    }
}
