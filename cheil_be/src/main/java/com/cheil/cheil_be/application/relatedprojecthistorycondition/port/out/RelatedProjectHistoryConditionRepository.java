package com.cheil.cheil_be.application.relatedprojecthistorycondition.port.out;

import com.cheil.cheil_be.application.relatedprojecthistorycondition.RelatedProjectHistoryConditionData;

import java.util.Optional;

public interface RelatedProjectHistoryConditionRepository {

    Optional<RelatedProjectHistoryConditionData> findByBidSeq(Long bidSeq);

    RelatedProjectHistoryConditionData save(
            Long bidSeq,
            String conditionsJson,
            String actor
    );
}
