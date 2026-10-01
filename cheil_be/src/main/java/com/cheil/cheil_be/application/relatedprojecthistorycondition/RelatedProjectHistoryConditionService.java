package com.cheil.cheil_be.application.relatedprojecthistorycondition;

import java.util.List;

import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.relatedprojecthistorycondition.exception.RelatedProjectHistoryConditionApplicationException;
import com.cheil.cheil_be.application.relatedprojecthistorycondition.port.in.RelatedProjectHistoryConditionUseCase;
import com.cheil.cheil_be.application.relatedprojecthistorycondition.port.out.RelatedProjectHistoryConditionRepository;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/** PQ 공고에 연결된 관련 프로젝트 이력 조회 조건을 저장하고 조회하는 서비스. */
@Service
@RequiredArgsConstructor
public class RelatedProjectHistoryConditionService implements RelatedProjectHistoryConditionUseCase {

    private final RelatedProjectHistoryConditionRepository repository;
    private final CurrentActorPort currentActorPort;
    private final Gson gson = new Gson();

    @Override
    @Transactional(readOnly = true)
    public RelatedProjectHistoryConditionData findByBidSeq(Long bidSeq) {
        validateBidSeq(bidSeq);
        return repository.findByBidSeq(bidSeq)
                .orElseGet(() -> RelatedProjectHistoryConditionData.empty(bidSeq));
    }

    @Override
    @Transactional
    public RelatedProjectHistoryConditionData save(Long bidSeq, String conditionsJson) {
        validateBidSeq(bidSeq);
        String normalizedJson = normalizeConditionsJson(conditionsJson);
        return repository.save(
                bidSeq,
                normalizedJson,
                currentActorPort.currentActor()
        );
    }

    private String normalizeConditionsJson(String conditionsJson) {
        if (!StringUtils.hasText(conditionsJson)) {
            return "[]";
        }

        try {
            List<ProjectHistoryCondition> conditions = gson.fromJson(
                    conditionsJson,
                    new TypeToken<List<ProjectHistoryCondition>>() {
                    }.getType()
            );
            return gson.toJson(conditions == null ? List.of() : conditions);
        } catch (Exception exception) {
            throw new RelatedProjectHistoryConditionApplicationException(
                    RelatedProjectHistoryConditionApplicationException.Type.BAD_REQUEST,
                    "관련 프로젝트 이력 조건 형식이 올바르지 않습니다.",
                    exception
            );
        }
    }

    private void validateBidSeq(Long bidSeq) {
        if (bidSeq == null || bidSeq <= 0) {
            throw new RelatedProjectHistoryConditionApplicationException(
                    RelatedProjectHistoryConditionApplicationException.Type.BAD_REQUEST,
                    "bidSeq는 1 이상의 값이어야 합니다."
            );
        }
    }

}
