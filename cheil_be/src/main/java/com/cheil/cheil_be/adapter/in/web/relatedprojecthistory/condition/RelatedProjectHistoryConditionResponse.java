package com.cheil.cheil_be.adapter.in.web.relatedprojecthistory.condition;

import com.cheil.cheil_be.application.relatedprojecthistory.condition.RelatedProjectHistoryConditionData;

import java.time.Instant;

public record RelatedProjectHistoryConditionResponse(
        Long bidSeq,
        String conditionsJson,
        Instant createdAt,
        String createdId,
        Instant lastChangedAt,
        String lastChangedId
) {
    public static RelatedProjectHistoryConditionResponse from(RelatedProjectHistoryConditionData data) {
        return new RelatedProjectHistoryConditionResponse(
                data.bidSeq(),
                data.conditionsJson(),
                data.createdAt(),
                data.createdId(),
                data.lastChangedAt(),
                data.lastChangedId()
        );
    }
}
