package com.cheil.cheil_be.application.relatedprojecthistorycondition;

import java.time.Instant;

public record RelatedProjectHistoryConditionData(
        Long bidSeq,
        String conditionsJson,
        Instant createdAt,
        String createdId,
        Instant lastChangedAt,
        String lastChangedId
) {
    public static RelatedProjectHistoryConditionData empty(Long bidSeq) {
        return new RelatedProjectHistoryConditionData(
                bidSeq,
                "[]",
                null,
                null,
                null,
                null
        );
    }
}
