package com.cheil.cheil_be.application.relatedprojecthistory.condition.port.out;

import com.cheil.cheil_be.application.relatedprojecthistory.condition.RelatedProjectHistoryConditionData;

import java.util.Optional;

public interface RelatedProjectHistoryConditionRepository {

    Optional<RelatedProjectHistoryConditionData> findByBidSeq(Long bidSeq);

    RelatedProjectHistoryConditionData save(
            Long bidSeq,
            String conditionsJson,
            String actor
    );
}
