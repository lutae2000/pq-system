package com.cheil.cheil_be.adapter.in.web.relatedprojecthistorycondition;

import java.time.Instant;

public record RelatedProjectHistoryConditionResponse(
        Long bidSeq,
        String conditionsJson,
        Instant createdAt,
        String createdId,
        Instant lastChangedAt,
        String lastChangedId
) {
}
