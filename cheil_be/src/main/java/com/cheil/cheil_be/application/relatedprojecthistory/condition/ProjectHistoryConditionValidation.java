package com.cheil.cheil_be.application.relatedprojecthistory.condition;

import static com.cheil.cheil_be.application.common.exception.ApplicationException.badRequest;
import static com.cheil.cheil_be.common.text.StringValues.normalize;
import static com.cheil.cheil_be.common.text.StringValues.optional;

import java.util.Map;

public final class ProjectHistoryConditionValidation {
    private ProjectHistoryConditionValidation() {}

    public static void validate(ProjectHistoryCondition condition, Map<String, ProjectHistoryConditionMetadata> metadata) {
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
