package com.cheil.cheil_be.application.relatedprojecthistorycondition;

import java.util.List;

import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.relatedprojecthistorycondition.port.out.RelatedProjectHistoryConditionRepository;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

/** PQ 공고에 연결된 관련 프로젝트 이력 조회 조건을 저장하고 조회하는 서비스. */
@Service
@RequiredArgsConstructor
public class RelatedProjectHistoryConditionService {

    private final RelatedProjectHistoryConditionRepository repository;
    private final CurrentActorPort currentActorPort;
    private final Gson gson = new Gson();

    @Transactional(readOnly = true)
    public RelatedProjectHistoryConditionData findByBidSeq(Long bidSeq) {
        return repository.findByBidSeq(bidSeq)
                .orElseGet(() -> RelatedProjectHistoryConditionData.empty(bidSeq));
    }

    @Transactional
    public RelatedProjectHistoryConditionData save(Long bidSeq, String conditionsJson) {
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
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Related project history conditions are invalid.", exception);
        }
    }

}
