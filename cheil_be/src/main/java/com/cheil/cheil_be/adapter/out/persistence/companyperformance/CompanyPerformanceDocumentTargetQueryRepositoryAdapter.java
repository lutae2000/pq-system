package com.cheil.cheil_be.adapter.out.persistence.companyperformance;

import static com.cheil.cheil_be.application.common.exception.ApplicationException.badRequest;
import static com.cheil.cheil_be.common.text.StringValues.trimToNull;

import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceDocumentTargetQueryRepository;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryCondition;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionGroups;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Repository
@RequiredArgsConstructor
public class CompanyPerformanceDocumentTargetQueryRepositoryAdapter
        implements CompanyPerformanceDocumentTargetQueryRepository {

    private static final Set<String> COMPARISON_OPERATORS = Set.of("=", "!=", ">=", "<=", ">", "<", "LIKE", "BETWEEN");
    private static final Map<String, String> GENERAL_COLUMNS = Map.of(
            "C0101C1", "cp.job_name",
            "C0102C1", "cp.client_kind",
            "C0104C1", "cp.contract_from_date",
            "C0105C1", "cp.contract_to_date",
            "C0107C1", "cp.contract_amt",
            "C0108C1", "cp.own_amt",
            "C0109C1", "cp.job_type",
            "C0110C1", "cp.summary"
    );

    private final JdbcClient jdbcClient;

    @Override
    public List<Long> findMatchingPerformanceSeqs(List<ProjectHistoryCondition> conditions) {
        if (conditions.isEmpty()) return List.of();
        Map<String, Object> parameters = new HashMap<>();
        var groups = new ProjectHistoryConditionGroups<String>(
                (left, right) -> "(" + left + " AND " + right + ")",
                (left, right) -> "(" + left + " OR " + right + ")");

        for (int index = 0; index < conditions.size(); index++) {
            ProjectHistoryCondition condition = conditions.get(index);
            String fragment = condition == null ? "" : conditionFragment(condition, parameters, index);
            if (fragment.isBlank()) {
                throw badRequest("회사실적에 적용할 수 없는 조건입니다. 조건 #" + (index + 1) + "을 확인해 주세요.");
            }
            groups.add(index, condition.logicalOperator(), condition.orGroupStart(), fragment);
        }

        String sql = """
                SELECT cp.seq
                FROM company_performances cp
                WHERE cp.job_own_yn = 'Y'
                  AND (%s)
                ORDER BY cp.contract_to_date NULLS LAST, cp.seq
                """.formatted(groups.result().orElseThrow());

        return jdbcClient.sql(sql)
                .params(parameters)
                .query(Long.class)
                .list();
    }

    private String conditionFragment(
            ProjectHistoryCondition condition,
            Map<String, Object> parameters,
            int index
    ) {
        String conditionType = condition.conditionType() == null ? "" : condition.conditionType();
        if ("constructionKind".equals(conditionType)) {
            return constructionKindFragment(condition, parameters, index);
        }
        if ("outline".equals(conditionType)) {
            return outlineFragment(condition, parameters, index);
        }

        String column = GENERAL_COLUMNS.get(condition.generalCode() == null ? "" : condition.generalCode());
        return column == null ? "" : comparison(column, condition, parameters, index);
    }

    private String constructionKindFragment(
            ProjectHistoryCondition condition,
            Map<String, Object> parameters,
            int index
    ) {
        if (isBlank(condition.level1Code())) {
            return "";
        }

        parameters.put("l1" + index, condition.level1Code());
        parameters.put("l2" + index, trimToNull(condition.level2Code()));
        parameters.put("l3" + index, trimToNull(condition.level3Code()));

        return """
                EXISTS (
                    SELECT 1
                    FROM company_performance_construction_kinds kind%s
                    WHERE kind%s.seq = cp.seq
                      AND kind%s.level1_code = :l1%s
                      AND (CAST(:l2%s AS TEXT) IS NULL OR kind%s.level2_code = :l2%s)
                      AND (CAST(:l3%s AS TEXT) IS NULL OR kind%s.level3_code = :l3%s)
                )
                """.formatted(
                index,
                index,
                index,
                index,
                index,
                index,
                index,
                index,
                index,
                index
        ).strip();
    }

    private String outlineFragment(
            ProjectHistoryCondition condition,
            Map<String, Object> parameters,
            int index
    ) {
        if (isBlank(condition.outlineCategoryCode()) && isBlank(condition.outlineSubcategoryCode())) {
            return "";
        }

        parameters.put("oc" + index, trimToNull(condition.outlineCategoryCode()));
        parameters.put("os" + index, trimToNull(condition.outlineSubcategoryCode()));
        String alias = "outline" + index;
        String comparison = comparison(alias + ".otln_cont", condition, parameters, index);
        String comparisonClause = comparison.isBlank() ? "" : " AND " + comparison;

        return """
                EXISTS (
                    SELECT 1
                    FROM company_performance_outlines %s
                    WHERE %s.seq = cp.seq
                      AND (CAST(:oc%s AS TEXT) IS NULL OR %s.cate_code = :oc%s)
                      AND (CAST(:os%s AS TEXT) IS NULL OR %s.subcate_code = :os%s)%s
                )
                """.formatted(
                alias,
                alias,
                index,
                alias,
                index,
                index,
                alias,
                index,
                comparisonClause
        ).strip();
    }

    private String comparison(
            String column,
            ProjectHistoryCondition condition,
            Map<String, Object> parameters,
            int index
    ) {
        String value = condition.value() == null ? "" : condition.value().trim();
        if (value.isBlank()) {
            return "";
        }

        String operator = condition.operator() == null
                ? "="
                : condition.operator().trim().toUpperCase(Locale.ROOT);
        if (!COMPARISON_OPERATORS.contains(operator)) {
            throw badRequest("지원하지 않는 회사실적 조건 연산자입니다.");
        }
        boolean numberValue = "number".equals(condition.valueType());
        String numericText = "NULLIF(REGEXP_REPLACE(CAST(" + column + " AS TEXT), '[^0-9.-]', '', 'g'), '')";
        String leftOperand = numberValue
                ? "CASE WHEN " + numericText + " ~ '^-?[0-9]+([.][0-9]+)?$' THEN CAST(" + numericText + " AS NUMERIC) END"
                : column;
        Object typedValue = numberValue
                ? new BigDecimal(value.replace(",", ""))
                : "LIKE".equals(operator) ? "%" + value.toLowerCase(Locale.ROOT) + "%" : value;

        parameters.put("v" + index, typedValue);
        if ("BETWEEN".equals(operator)) {
            Object typedValueTo = numberValue
                    ? new BigDecimal(normalizeNumber(condition.valueTo()))
                    : condition.valueTo();
            parameters.put("vt" + index, typedValueTo);
            return leftOperand + " BETWEEN :v" + index + " AND :vt" + index;
        }

        if ("LIKE".equals(operator)) {
            return "LOWER(CAST(" + column + " AS TEXT)) LIKE :v" + index;
        }
        return leftOperand + " " + operator + " :v" + index;
    }

    private String normalizeNumber(String value) {
        return (value == null ? "" : value).replace(",", "");
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
