package com.cheil.cheil_be.adapter.in.web.engineerperformancedoc;

public record EngineerProjectHistoryReviewSyncRequest(
        Long bidSeq,
        String engineerId,
        String relatedProjectHistoryConditions
) {
}
