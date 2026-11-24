package com.cheil.cheil_be.adapter.out.persistence.pqparticipatingengineer;

import static com.cheil.cheil_be.application.common.exception.ApplicationException.badRequest;
import static com.cheil.cheil_be.common.text.StringValues.digitsOnly;
import static com.cheil.cheil_be.common.text.StringValues.normalize;
import static com.cheil.cheil_be.common.text.StringValues.trimToNull;

import com.cheil.cheil_be.application.pqparticipatingengineer.model.CandidateEngineer;
import com.cheil.cheil_be.application.pqparticipatingengineer.model.CandidateEngineerFilters;
import com.cheil.cheil_be.application.pqparticipatingengineer.port.out.CandidateEngineerRepository;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryCondition;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionMetadata;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

@Repository
@RequiredArgsConstructor
public class CandidateEngineerJdbcRepository implements CandidateEngineerRepository {

    private static final Set<String> COMPARISON_OPERATORS = Set.of("=", "!=", ">=", "<=", ">", "<", "LIKE", "BETWEEN");

    private final JdbcClient jdbcClient;

    @Override
    public Page<CandidateEngineer> findCandidates(
            CandidateEngineerFilters filters,
            List<ProjectHistoryCondition> conditions,
            Map<String, ProjectHistoryConditionMetadata> metadata,
            Pageable pageable
    ) {
        QueryParts queryParts = buildCandidateWhere(filters, conditions, metadata);

        String selectSql = """
                SELECT
                    m.engr_id,
                    m.namekor,
                    m.birthday,
                    m.deptname,
                    m.grade,
                    m.dutypart,
                    m.propart,
                    m.design_grade,
                    m.construction_management_grade,
                    m.retireyn
                FROM pq_engineer_master m
                %s
                ORDER BY m.namekor NULLS LAST, m.engr_id
                LIMIT :limit OFFSET :offset
                """.formatted(queryParts.whereSql());
        Map<String, Object> selectParams = new LinkedHashMap<>(queryParts.params());
        selectParams.put("limit", pageable.getPageSize());
        selectParams.put("offset", pageable.getOffset());

        List<CandidateEngineer> rows = jdbcClient.sql(selectSql)
                .params(selectParams)
                .query((rs, rowNum) -> new CandidateEngineer(
                        rs.getString("engr_id"),
                        rs.getString("namekor"),
                        rs.getString("birthday"),
                        rs.getString("deptname"),
                        rs.getString("grade"),
                        rs.getString("dutypart"),
                        rs.getString("propart"),
                        rs.getString("design_grade"),
                        rs.getString("construction_management_grade"),
                        rs.getString("retireyn")
                ))
                .list();

        Long total = jdbcClient.sql("SELECT COUNT(*) FROM pq_engineer_master m " + queryParts.whereSql())
                .params(queryParts.params())
                .query(Long.class)
                .single();

        return new PageImpl<>(rows, pageable, total == null ? 0L : total);
    }

    private QueryParts buildCandidateWhere(
            CandidateEngineerFilters filters,
            List<ProjectHistoryCondition> projectHistoryConditions,
            Map<String, ProjectHistoryConditionMetadata> conditionMetadata
    ) {
        List<String> conditions = new ArrayList<>();
        Map<String, Object> params = new LinkedHashMap<>();

        if (StringUtils.hasText(filters.keyword())) {
            conditions.add("""
                    (
                        LOWER(m.namekor) LIKE :keyword
                        OR LOWER(m.deptname) LIKE :keyword
                        OR LOWER(m.grade) LIKE :keyword
                        OR LOWER(m.dutypart) LIKE :keyword
                        OR LOWER(m.propart) LIKE :keyword
                    )
                    """);
            params.put("keyword", "%" + filters.keyword().trim().toLowerCase(Locale.ROOT) + "%");
        }
        addEquals(conditions, params, "m.retireyn", "retireYn", filters.retireYn());
        addEquals(conditions, params, "m.construction_management_grade", "constructionManagementGrade", filters.constructionManagementGrade());
        addEquals(conditions, params, "m.design_grade", "designGrade", filters.designGrade());
        addEquals(conditions, params, "m.dutypart", "jobField", filters.jobField());
        addEquals(conditions, params, "m.propart", "specialtyField", filters.specialtyField());

        if (StringUtils.hasText(filters.certificationName())) {
            conditions.add("""
                    m.engr_id IN (
                        SELECT l.engr_id
                        FROM pq_engineer_license l
                        WHERE LOWER(l.license_code) LIKE :certificationName
                    )
                    """);
            params.put("certificationName", "%" + filters.certificationName().trim().toLowerCase(Locale.ROOT) + "%");
        }

        if (filters.bidSeq() != null) {
            String workDuty = trimToNull(filters.workDutyId());
            String workDutyPredicate = "";
            if (workDuty != null) {
                workDutyPredicate = "AND s.work_duty_id = :excludeWorkDutyId";
                params.put("excludeWorkDutyId", workDuty);
            }
            conditions.add("""
                    NOT EXISTS (
                        SELECT 1
                        FROM pq_find_engr_info s
                        WHERE s.bid_seq = :excludeBidSeq
                          AND s.engr_id = m.engr_id
                          %s
                    )
                    """.formatted(workDutyPredicate));
            params.put("excludeBidSeq", filters.bidSeq());
        }

        String historySql = buildProjectHistoryConditionSql(projectHistoryConditions, params, conditionMetadata);
        if (StringUtils.hasText(historySql)) {
            conditions.add(historySql);
        }

        if (conditions.isEmpty()) {
            return new QueryParts("", params);
        }
        return new QueryParts("WHERE " + String.join("\nAND ", conditions), params);
    }

    private String buildProjectHistoryConditionSql(List<ProjectHistoryCondition> projectHistoryConditions, Map<String, Object> params,
            Map<String, ProjectHistoryConditionMetadata> conditionMetadata) {
        if (projectHistoryConditions.isEmpty()) return "";
        List<String> fragments = new ArrayList<>();
        for (int i = 0; i < projectHistoryConditions.size(); i++) {
            ProjectHistoryCondition condition = projectHistoryConditions.get(i);
            String fragment = switch (normalize(condition.conditionType())) {
                case "constructionKind" -> constructionKindCondition(condition, params, i);
                case "general" -> generalCondition(condition, params, i, conditionMetadata);
                case "outline" -> outlineCondition(condition, params, i, conditionMetadata);
                default -> throw badRequest("관련공사 참여이력 조건 유형을 확인해 주세요.");
            };
            String logicalOperator = fragments.isEmpty() ? "" : " " + logicalOperator(condition.logicalOperator()) + " ";
            fragments.add(logicalOperator + fragment);
        }
        return """
                EXISTS (
                    SELECT 1
                    FROM pq_engineer_project_history h
                    WHERE h.engr_id = m.engr_id
                      AND (%s)
                )
                """.formatted(String.join("", fragments));
    }

    private String constructionKindCondition(ProjectHistoryCondition condition, Map<String, Object> params, int index) {
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

    private String generalCondition(ProjectHistoryCondition condition, Map<String, Object> params, int index,
            Map<String, ProjectHistoryConditionMetadata> conditionMetadata) {
        ProjectHistoryConditionMetadata metadata = conditionMetadata.get(normalize(condition.generalCode()));
        if ("pq_engineer_project_history".equalsIgnoreCase(metadata.table())) {
            return comparisonPredicate("h." + metadata.column(), condition, params, index, metadata.valueType());
        }
        String predicate = comparisonPredicate("target." + metadata.column(), condition, params, index, metadata.valueType());
        return existsForProject(metadata.table(), predicate);
    }

    private String outlineCondition(ProjectHistoryCondition condition, Map<String, Object> params, int index,
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

    private String existsForProject(String table, String predicate) {
        return """
                EXISTS (
                    SELECT 1 FROM %s target
                    WHERE target.seq = h.seq AND %s
                )
                """.formatted(table, predicate);
    }

    private String comparisonPredicate(String column, ProjectHistoryCondition condition, Map<String, Object> params, int index,
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

    private void addEquals(List<String> conditions, Map<String, Object> params, String column, String paramName, String value) {
        String normalized = trimToNull(value);
        if (!StringUtils.hasText(normalized)) {
            return;
        }
        conditions.add(column + " = :" + paramName);
        params.put(paramName, normalized);
    }

    private String operator(String value) {
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

    private String logicalOperator(String value) {
        return "OR".equalsIgnoreCase(trimToNull(value)) ? "OR" : "AND";
    }

    private BigDecimal number(String value, String fieldName) {
        try {
            return new BigDecimal(value.replace(",", ""));
        } catch (NumberFormatException exception) {
            throw badRequest(fieldName + "는 숫자여야 합니다.", exception);
        }
    }

    private Object typedValue(String value, String fieldName, boolean numberType, boolean dateType) {
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

    private record QueryParts(String whereSql, Map<String, Object> params) {
    }
}
