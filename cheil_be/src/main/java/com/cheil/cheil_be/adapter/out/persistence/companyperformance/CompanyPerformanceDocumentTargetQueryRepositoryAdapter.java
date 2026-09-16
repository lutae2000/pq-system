package com.cheil.cheil_be.adapter.out.persistence.companyperformance;

import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceDocumentTargetQueryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class CompanyPerformanceDocumentTargetQueryRepositoryAdapter
        implements CompanyPerformanceDocumentTargetQueryRepository {

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
    public List<Long> findUnselectedPerformanceSeqs(Long bidSeq, List<Condition> conditions) {
        Map<String, Object> parameters = new HashMap<>();
        List<String> fragments = new ArrayList<>();

        for (int index = 0; index < conditions.size(); index++) {
            Condition condition = conditions.get(index);
            String fragment = conditionFragment(condition, parameters, index);
            if (fragment.isBlank()) {
                continue;
            }
            if (!fragments.isEmpty()) {
                String logicalOperator = "OR".equalsIgnoreCase(condition.logicalOperator()) ? "OR" : "AND";
                fragments.add(" " + logicalOperator + " ");
            }
            fragments.add(fragment);
        }

        if (fragments.isEmpty()) {
            return List.of();
        }

        String sql = """
                SELECT cp.seq
                FROM company_performances cp
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM pq_company_performance_document_targets target
                    WHERE target.bid_seq = :bidSeq
                      AND target.company_performance_seq = cp.seq
                )
                  AND (%s)
                """.formatted(String.join("", fragments));

        parameters.put("bidSeq", bidSeq);
        return jdbcClient.sql(sql)
                .params(parameters)
                .query(Long.class)
                .list();
    }

    private String conditionFragment(
            Condition condition,
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

        String column = GENERAL_COLUMNS.get(condition.generalCode());
        return column == null ? "" : comparison(column, condition, parameters, index);
    }

    private String constructionKindFragment(
            Condition condition,
            Map<String, Object> parameters,
            int index
    ) {
        if (isBlank(condition.level1Code())) {
            return "";
        }

        parameters.put("l1" + index, condition.level1Code());
        parameters.put("l2" + index, condition.level2Code());
        parameters.put("l3" + index, condition.level3Code());

        return """
                EXISTS (
                    SELECT 1
                    FROM company_performance_construction_kinds kind%s
                    WHERE kind%s.seq = cp.seq
                      AND kind%s.level1_code = :l1%s
                      AND (:l2%s IS NULL OR kind%s.level2_code = :l2%s)
                      AND (:l3%s IS NULL OR kind%s.level3_code = :l3%s)
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
            Condition condition,
            Map<String, Object> parameters,
            int index
    ) {
        if (isBlank(condition.outlineCategoryCode()) && isBlank(condition.outlineSubcategoryCode())) {
            return "";
        }

        parameters.put("oc" + index, condition.outlineCategoryCode());
        parameters.put("os" + index, condition.outlineSubcategoryCode());
        String alias = "outline" + index;
        String comparison = comparison(alias + ".otln_cont", condition, parameters, index);
        String comparisonClause = comparison.isBlank() ? "" : " AND " + comparison;

        return """
                EXISTS (
                    SELECT 1
                    FROM company_performance_outlines %s
                    WHERE %s.seq = cp.seq
                      AND (:oc%s IS NULL OR %s.cate_code = :oc%s)
                      AND (:os%s IS NULL OR %s.subcate_code = :os%s)%s
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
            Condition condition,
            Map<String, Object> parameters,
            int index
    ) {
        String value = condition.value() == null ? "" : condition.value().trim();
        if (value.isBlank()) {
            return "";
        }

        String operator = condition.operator() == null
                ? "="
                : condition.operator().toUpperCase(Locale.ROOT);
        boolean numberValue = "number".equals(condition.valueType());
        String leftOperand = numberValue
                ? "CAST(NULLIF(REGEXP_REPLACE(CAST(" + column
                        + " AS TEXT), '[^0-9.-]', '', 'g'), '') AS NUMERIC)"
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
