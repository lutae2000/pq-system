package com.cheil.cheil_be.adapter.out.persistence.relatedprojecthistory;

import static com.cheil.cheil_be.application.common.exception.ApplicationException.badRequest;
import static com.cheil.cheil_be.common.text.StringValues.digitsOnly;
import static com.cheil.cheil_be.common.text.StringValues.normalize;
import static com.cheil.cheil_be.common.text.StringValues.trimToNull;

import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryCondition;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionGroups;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionMetadata;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.util.StringUtils;

public final class ProjectHistoryJdbcPredicate {
    private static final Set<String> COMPARISON_OPERATORS = Set.of("=", "!=", ">=", "<=", ">", "<", "LIKE", "BETWEEN");

    private ProjectHistoryJdbcPredicate() {}

    public static String build(List<ProjectHistoryCondition> projectHistoryConditions, Map<String, Object> params,
            Map<String, ProjectHistoryConditionMetadata> conditionMetadata) {
        if (projectHistoryConditions.isEmpty()) return "";
        var groups = new ProjectHistoryConditionGroups<String>(
                (left, right) -> "(" + left + " AND " + right + ")",
                (left, right) -> "(" + left + " OR " + right + ")");
        for (int i = 0; i < projectHistoryConditions.size(); i++) {
            ProjectHistoryCondition condition = projectHistoryConditions.get(i);
            String fragment = switch (normalize(condition.conditionType())) {
                case "constructionKind" -> constructionKindCondition(condition, params, i);
                case "general" -> generalCondition(condition, params, i, conditionMetadata);
                case "outline" -> outlineCondition(condition, params, i, conditionMetadata);
                default -> throw badRequest("관련공사 참여이력 조건 유형을 확인해 주세요.");
            };
            groups.add(i, condition.logicalOperator(), condition.orGroupStart(), fragment);
        }
        return groups.result().orElseThrow();
    }

    private static String constructionKindCondition(ProjectHistoryCondition condition, Map<String, Object> params, int index) {
        List<String> predicates = new ArrayList<>();
        addEquals(predicates, params, "k.level1_code", "historyLevel1Code" + index, condition.level1Code());
        addEquals(predicates, params, "k.level2_code", "historyLevel2Code" + index, condition.level2Code());
        addEquals(predicates, params, "k.level3_code", "historyLevel3Code" + index, condition.level3Code());
        return """
                EXISTS (
                    SELECT 1 FROM company_performance_construction_kinds k
                    WHERE k.seq = h.seq AND %s
                )
                """.formatted(String.join(" AND ", predicates));
    }

    private static String generalCondition(ProjectHistoryCondition condition, Map<String, Object> params, int index,
            Map<String, ProjectHistoryConditionMetadata> conditionMetadata) {
        ProjectHistoryConditionMetadata metadata = conditionMetadata.get(normalize(condition.generalCode()));
        if ("pq_engineer_project_history".equalsIgnoreCase(metadata.table())) {
            return comparisonPredicate("h." + metadata.column(), condition, params, index, metadata.valueType());
        }
        String predicate = comparisonPredicate("target." + metadata.column(), condition, params, index, metadata.valueType());
        return existsForProject(metadata.table(), predicate);
    }

    private static String outlineCondition(ProjectHistoryCondition condition, Map<String, Object> params, int index,
            Map<String, ProjectHistoryConditionMetadata> conditionMetadata) {
        String categoryCode = normalize(condition.outlineCategoryCode());
        String subcategoryCode = normalize(condition.outlineSubcategoryCode());
        ProjectHistoryConditionMetadata metadata = conditionMetadata.get(categoryCode + subcategoryCode);
        List<String> predicates = new ArrayList<>();
        addEquals(predicates, params, "target.cate_code", "outlineCategoryCode" + index, categoryCode);
        addEquals(predicates, params, "target.subcate_code", "outlineSubcategoryCode" + index, subcategoryCode);
        predicates.add(comparisonPredicate("target." + metadata.column(), condition, params, index, metadata.valueType()));
        return existsForProject(metadata.table(), String.join(" AND ", predicates));
    }

    private static String existsForProject(String table, String predicate) {
        return """
                EXISTS (
                    SELECT 1 FROM %s target
                    WHERE target.seq = h.seq AND %s
                )
                """.formatted(table, predicate);
    }

    private static String comparisonPredicate(String column, ProjectHistoryCondition condition, Map<String, Object> params, int index,
            String metadataValueType) {
        String value = normalize(condition.value());
        String operator = operator(condition.operator());

        String valueType = StringUtils.hasText(metadataValueType) ? metadataValueType : trimToNull(condition.valueType());
        boolean numberType = "number".equals(valueType);
        boolean dateType = "date".equals(valueType);
        String numericText = "NULLIF(REGEXP_REPLACE(CAST(" + column + " AS TEXT), '[^0-9.-]', '', 'g'), '')";
        String expression = column;
        if (numberType) {
            expression = "CASE WHEN " + numericText + " ~ '^-?[0-9]+([.][0-9]+)?$' THEN CAST(" + numericText + " AS NUMERIC) END";
        } else if (dateType) {
            String dateText = "REGEXP_REPLACE(CAST(" + column + " AS TEXT), '[^0-9]', '', 'g')";
            expression = "CASE WHEN LENGTH(" + dateText + ") = 8 THEN " + dateText + " END";
        }
        String paramName = "historyValue" + index;
        String valueToParamName = "historyValueTo" + index;

        if ("LIKE".equals(operator)) {
            params.put(paramName, "%" + value.toLowerCase(Locale.ROOT) + "%");
            return "LOWER(CAST(" + column + " AS TEXT)) LIKE :" + paramName;
        }
        if ("BETWEEN".equals(operator)) {
            params.put(paramName, typedValue(value, paramName, numberType, dateType));
            params.put(valueToParamName, typedValue(normalize(condition.valueTo()), valueToParamName, numberType, dateType));
            return expression + " BETWEEN :" + paramName + " AND :" + valueToParamName;
        }

        params.put(paramName, typedValue(value, paramName, numberType, dateType));
        return expression + " " + operator + " :" + paramName;
    }

    public static void addEquals(List<String> conditions, Map<String, Object> params, String column, String paramName, String value) {
        String normalized = trimToNull(value);
        if (!StringUtils.hasText(normalized)) {
            return;
        }
        conditions.add(column + " = :" + paramName);
        params.put(paramName, normalized);
    }

    private static String operator(String value) {
        String normalized = trimToNull(value);
        if (!StringUtils.hasText(normalized)) {
            return "=";
        }
        String operator = normalized.toUpperCase(Locale.ROOT);
        // 비교 연산자는 화이트리스트로 제한해야 사용자가 전달한 문자열이 SQL 구조에 들어가지 않습니다.
        if (!COMPARISON_OPERATORS.contains(operator)) {
            throw badRequest("지원하지 않는 비교 조건입니다.");
        }
        return operator;
    }

    private static BigDecimal number(String value, String fieldName) {
        try {
            return new BigDecimal(value.replace(",", ""));
        } catch (NumberFormatException exception) {
            throw badRequest(fieldName + "는 숫자여야 합니다.", exception);
        }
    }

    private static Object typedValue(String value, String fieldName, boolean numberType, boolean dateType) {
        if (numberType) {
            return number(value, fieldName);
        }
        if (dateType) {
            String digits = digitsOnly(value);
            try {
                return LocalDate.parse(digits, DateTimeFormatter.BASIC_ISO_DATE).format(DateTimeFormatter.BASIC_ISO_DATE);
            } catch (DateTimeParseException exception) {
                throw badRequest("관련공사 참여이력 날짜를 확인해 주세요.", exception);
            }
        }
        return value;
    }

}
