package com.cheil.cheil_be.application.relatedprojecthistorycondition.port.in;

import com.cheil.cheil_be.application.relatedprojecthistorycondition.RelatedProjectHistoryConditionData;

/** PQ 관련 프로젝트 이력 조건 조회·저장 유스케이스. */
public interface RelatedProjectHistoryConditionUseCase {

    RelatedProjectHistoryConditionData findByBidSeq(Long bidSeq);

    RelatedProjectHistoryConditionData save(Long bidSeq, String conditionsJson);
}
