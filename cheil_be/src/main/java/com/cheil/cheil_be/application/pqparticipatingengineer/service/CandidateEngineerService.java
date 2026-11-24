package com.cheil.cheil_be.application.pqparticipatingengineer.service;

import static com.cheil.cheil_be.application.common.exception.ApplicationException.badRequest;
import static com.cheil.cheil_be.common.text.StringValues.normalize;
import static com.cheil.cheil_be.common.text.StringValues.optional;

import com.cheil.cheil_be.application.pqparticipatingengineer.model.CandidateEngineer;
import com.cheil.cheil_be.application.pqparticipatingengineer.model.CandidateEngineerFilters;
import com.cheil.cheil_be.application.pqparticipatingengineer.port.in.FindCandidateEngineersUseCase;
import com.cheil.cheil_be.application.pqparticipatingengineer.port.out.CandidateEngineerRepository;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryCondition;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionJsonCodec;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionMetadata;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionMetadataService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CandidateEngineerService implements FindCandidateEngineersUseCase {

    private final CandidateEngineerRepository repository;
    private final ProjectHistoryConditionJsonCodec conditionJsonCodec;
    private final ProjectHistoryConditionMetadataService conditionMetadataService;

    @Override
    @Transactional(readOnly = true)
    public Page<CandidateEngineer> findCandidates(CandidateEngineerFilters filters, String conditionsJson, Pageable pageable) {
        List<ProjectHistoryCondition> conditions = conditionJsonCodec.parse(conditionsJson);
        Map<String, ProjectHistoryConditionMetadata> metadata = conditions.isEmpty()
                ? Map.of() : conditionMetadataService.findAll();
        conditions.forEach(condition -> validateCondition(condition, metadata));
        return repository.findCandidates(filters, conditions, metadata, pageable);
    }

    private void validateCondition(ProjectHistoryCondition condition, Map<String, ProjectHistoryConditionMetadata> metadata) {
        if (condition == null) throw badRequest("관련공사 참여이력 조건을 확인해 주세요.");
        String label = optional(condition.label(), "관련공사 참여이력");
        String type = normalize(condition.conditionType());
        if ("constructionKind".equals(type)) {
            if (normalize(condition.level1Code()).isEmpty()) throw badRequest(label + " 공사종류를 선택해 주세요.");
            return;
        }
        String code = switch (type) {
            case "general" -> normalize(condition.generalCode());
            case "outline" -> normalize(condition.outlineCategoryCode()) + normalize(condition.outlineSubcategoryCode());
            default -> throw badRequest(label + " 조건 유형을 확인해 주세요.");
        };
        ProjectHistoryConditionMetadata definition = metadata.get(code);
        if (definition == null) throw badRequest(label + " 조건을 다시 선택해 주세요.");
        String expectedType = normalize(definition.valueType());
        String currentType = normalize(condition.valueType());
        if (("number".equals(expectedType) || "date".equals(expectedType))
                && !currentType.isEmpty() && !expectedType.equals(currentType)) {
            throw badRequest(label + " 조건값의 형식이 변경되었습니다. 조건을 다시 설정해 주세요.");
        }
        if (normalize(condition.value()).isEmpty()) throw badRequest(label + " 조건값을 입력해 주세요.");
        if ("BETWEEN".equalsIgnoreCase(normalize(condition.operator())) && normalize(condition.valueTo()).isEmpty()) {
            throw badRequest(label + " 범위의 끝값을 입력해 주세요.");
        }
    }

}
