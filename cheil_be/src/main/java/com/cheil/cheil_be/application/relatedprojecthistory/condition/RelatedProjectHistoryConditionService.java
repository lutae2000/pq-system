package com.cheil.cheil_be.application.relatedprojecthistory.condition;

import com.cheil.cheil_be.application.common.validation.InputValues;

import static com.cheil.cheil_be.application.common.validation.InputValues.requiredPositive;

import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.port.in.RelatedProjectHistoryConditionUseCase;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.port.out.RelatedProjectHistoryConditionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** PQ 공고에 연결된 관련 프로젝트 이력 조회 조건을 저장하고 조회하는 서비스. */
@Service
@RequiredArgsConstructor
public class RelatedProjectHistoryConditionService implements RelatedProjectHistoryConditionUseCase {

    private final RelatedProjectHistoryConditionRepository repository;
    private final CurrentActorPort currentActorPort;
    private final ProjectHistoryConditionJsonCodec conditionJsonCodec;

    @Override
    @Transactional(readOnly = true)
    public RelatedProjectHistoryConditionData findByBidSeq(Long bidSeq) {
        requiredPositive(bidSeq, "bidSeq");
        return repository.findByBidSeq(bidSeq)
                .orElseGet(() -> RelatedProjectHistoryConditionData.empty(bidSeq));
    }

    @Override
    @Transactional
    public RelatedProjectHistoryConditionData save(Long bidSeq, String conditionsJson) {
        requiredPositive(bidSeq, "bidSeq");
        String normalizedJson = conditionJsonCodec.normalize(conditionsJson);
        return repository.save(
                bidSeq,
                normalizedJson,
                currentActorPort.currentActor()
        );
    }

}
