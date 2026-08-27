package com.cheil.cheil_be.application.engineerperformancedoc.service;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.engineerperformancedoc.EngineerProjectHistoryReviewRequest;
import com.cheil.cheil_be.adapter.in.web.engineerperformancedoc.EngineerProjectHistoryReviewSyncRequest;
import com.cheil.cheil_be.adapter.in.web.engineerperformancedoc.EngineerProjectHistoryReviewResponse;
import com.cheil.cheil_be.common.security.AuditActorResolver;

@Service
@RequiredArgsConstructor
public class EngineerPerformanceDocumentService {

    private static final Set<String> COMPARISON_OPERATORS = Set.of("=", "!=", ">=", "<=", ">", "<", "LIKE", "BETWEEN");
    private static final Map<String, String> GENERAL_COLUMNS = Map.ofEntries(
            Map.entry("C0101C1", "cp.job_name"),
            Map.entry("C0102C1", "cp.client_kind"),
            Map.entry("C0104C1", "cp.contract_from_date"),
            Map.entry("C0105C1", "cp.contract_to_date"),
            Map.entry("C0107C1", "cp.contract_amt"),
            Map.entry("C0108C1", "cp.job_type"),
            Map.entry("C0108C1_AMT", "cp.own_amt"),
            Map.entry("C0110C1", "cp.business_type"),
            Map.entry("C0120C1", "h.startdt"),
            Map.entry("C0121C1", "cp.summary"),
            Map.entry("C0130C1", "cp.job_finish_yn"),
            Map.entry("C0140C1", "h.joinyn"),
            Map.entry("C0141C1", "h.returnyn"),
            Map.entry("C0150C1", "h.compname"),
            Map.entry("C0160C1", "h.jobpart")
    );
    private static final Set<String> NUMERIC_COLUMNS = Set.of("cp.contract_amt", "cp.own_amt");

    private final JdbcClient jdbcClient;
    private final Gson gson = new Gson();

    @Transactional(readOnly = true)
    public List<EngineerProjectHistoryReviewResponse> findProjectHistories(String engineerId) {
        if (!StringUtils.hasText(engineerId)) {
            return List.of();
        }

        return jdbcClient.sql("""
                        SELECT
                            NULL::BIGINT AS review_id,
                            NULL::BIGINT AS bid_seq,
                            h.engr_id AS engineer_id,
                            h.id AS source_seq,
                            NULL::INTEGER AS display_order,
                            CAST(h.id AS TEXT) AS id,
                            cp.job_name AS jobname,
                            cp.summary,
                            to_char(to_date(cp.contract_from_date, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) || '~' || chr(10) ||
                                to_char(to_date(cp.contract_to_date, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) ||
                                '(' || to_char(to_date(cp.contract_to_date, 'YYYYMMDD') - to_date(cp.contract_from_date, 'YYYYMMDD'), 'FM999,999,999,999') || '일)' AS contract_term,
                            to_date(cp.contract_to_date, 'YYYYMMDD') - to_date(cp.contract_from_date, 'YYYYMMDD') + 1 AS contract_days,
                            to_char(to_date(h.startdt, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) || '~' || chr(10) ||
                                to_char(to_date(h.enddt, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) ||
                                '(' || to_char(to_date(h.enddt, 'YYYYMMDD') - to_date(h.startdt, 'YYYYMMDD'), 'FM999,999,999,999') || '일)' AS work_term,
                            to_date(h.enddt, 'YYYYMMDD') - to_date(h.startdt, 'YYYYMMDD') + 1 AS work_days,
                            cp.seq,
                            cp.order_client,
                            cp.contract_amt,
                            cp.own_amt,
                            cp.division_rate,
                            cp.contract_from_date,
                            cp.contract_to_date,
                            h.startdt AS work_from_date,
                            h.enddt AS work_to_date,
                            h.jobclass,
                            h.method,
                            h.jobtag,
                            h.jobpart,
                            h.propart,
                            h.englevel,
                            h.compname,
                            h.deptname,
                            h.grade,
                            h.duty,
                            h.returnyn,
                            h.joinyn,
                            h.join_day,
                            h.part_day,
                            h.select_day,
                            h.remark,
                            NULL::TIMESTAMP AS created_at,
                            NULL::VARCHAR AS created_id,
                            NULL::TIMESTAMP AS last_changed_at,
                            NULL::VARCHAR AS last_changed_id
                        FROM pq_engineer_project_history h
                        JOIN company_performances cp
                          ON cp.seq = h.seq
                        WHERE h.engr_id = :engineerId
                        ORDER BY cp.contract_to_date DESC NULLS LAST, h.enddt DESC NULLS LAST, h.seq DESC
                        """)
                .param("engineerId", engineerId.trim())
                .query(this::mapResponse)
                .list();
    }

    @Transactional(readOnly = true)
    public List<EngineerProjectHistoryReviewResponse> findReviewResults(
            Long bidSeq,
            String engineerId,
            String relatedProjectHistoryConditions
    ) {
        if (bidSeq == null || !StringUtils.hasText(engineerId)) {
            return List.of();
        }

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("bidSeq", bidSeq);
        params.put("engineerId", engineerId.trim());
        String sql = """
                SELECT
                    r.review_id,
                    r.bid_seq,
                    r.engineer_id,
                    r.source_seq,
                    r.display_order,
                    CAST(h.id AS TEXT) AS id,
                    cp.job_name AS jobname,
                    cp.summary,
                    to_char(to_date(cp.contract_from_date, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) || '~' || chr(10) ||
                        to_char(to_date(cp.contract_to_date, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) ||
                        '(' || to_char(to_date(cp.contract_to_date, 'YYYYMMDD') - to_date(cp.contract_from_date, 'YYYYMMDD'), 'FM999,999,999,999') || '일)' AS contract_term,
                    to_date(cp.contract_to_date, 'YYYYMMDD') - to_date(cp.contract_from_date, 'YYYYMMDD') AS contract_days,
                    to_char(to_date(h.startdt, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) || '~' || chr(10) ||
                        to_char(to_date(h.enddt, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) ||
                        '(' || to_char(to_date(h.enddt, 'YYYYMMDD') - to_date(h.startdt, 'YYYYMMDD'), 'FM999,999,999,999') || '일)' AS work_term,
                    to_date(h.enddt, 'YYYYMMDD') - to_date(h.startdt, 'YYYYMMDD') AS work_days,
                    cp.seq,
                    cp.order_client,
                    cp.contract_amt,
                    cp.own_amt,
                    cp.division_rate,
                    cp.contract_from_date,
                    cp.contract_to_date,
                    h.startdt AS work_from_date,
                    h.enddt AS work_to_date,
                    h.jobclass,
                    h.method,
                    h.jobtag,
                    h.jobpart,
                    h.propart,
                    h.englevel,
                    h.compname,
                    h.deptname,
                    h.grade,
                    h.duty,
                    h.returnyn,
                    h.joinyn,
                    h.join_day,
                    h.part_day,
                    h.select_day,
                    h.remark,
                    r.created_at,
                    r.created_id,
                    r.last_changed_at,
                    r.last_changed_id
                FROM pq_engineer_project_history_review_results r
                JOIN pq_engineer_project_history h
                  ON h.engr_id = r.engineer_id
                 AND h.id = r.source_seq
                JOIN company_performances cp
                  ON cp.seq = h.seq
                WHERE r.bid_seq = :bidSeq
                  AND r.engineer_id = :engineerId
                ORDER BY r.display_order NULLS LAST, r.review_id
                """;

        return jdbcClient.sql(sql)
                .params(params)
                .query(this::mapResponse)
                .list();
    }

    @Transactional
    public EngineerProjectHistoryReviewResponse createReviewResult(EngineerProjectHistoryReviewRequest request) {
        Long bidSeq = requiredBidSeq(request.bidSeq());
        String engineerId = required(request.engineerId(), "engineerId");
        Integer sourceSeq = requiredSourceSeq(request.sourceSeq());
        ensureSourceHistoryExists(engineerId, sourceSeq);
        Integer displayOrder = request.displayOrder() == null ? nextDisplayOrder(bidSeq, engineerId) : request.displayOrder();

        String actor = AuditActorResolver.resolve();
        Long reviewId = jdbcClient.sql("""
                        INSERT INTO pq_engineer_project_history_review_results (
                            bid_seq, engineer_id, source_seq, display_order, created_id, last_changed_id
                        )
                        VALUES (
                            :bidSeq, :engineerId, :sourceSeq, :displayOrder, :actor, :actor
                        )
                        ON CONFLICT (bid_seq, engineer_id, source_seq)
                        DO UPDATE SET
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = EXCLUDED.last_changed_id
                        RETURNING review_id
                        """)
                .param("bidSeq", bidSeq)
                .param("engineerId", engineerId)
                .param("sourceSeq", sourceSeq)
                .param("displayOrder", displayOrder)
                .param("actor", actor)
                .query(Long.class)
                .single();

        return findByReviewId(reviewId);
    }

    @Transactional
    public List<EngineerProjectHistoryReviewResponse> syncReviewResults(EngineerProjectHistoryReviewSyncRequest request) {
        Long bidSeq = requiredBidSeq(request.bidSeq());
        String engineerId = required(request.engineerId(), "engineerId");
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("bidSeq", bidSeq);
        params.put("engineerId", engineerId);

        List<ProjectHistoryCondition> conditions = parseProjectHistoryConditions(request.relatedProjectHistoryConditions());
        String conditionSql = buildProjectHistoryConditionSql(conditions, params);
        String selectSql = """
                SELECT DISTINCT h.id
                FROM pq_engineer_project_history h
                JOIN company_performances cp
                  ON cp.seq = h.seq
                WHERE h.engr_id = :engineerId
                  AND NOT EXISTS (
                      SELECT 1
                      FROM pq_engineer_project_history_review_results existing
                      WHERE existing.bid_seq = :bidSeq
                        AND existing.engineer_id = :engineerId
                        AND existing.source_seq = h.id
                  )
                """ + conditionSql + """
                ORDER BY h.id
                """;

        List<Integer> matchingSourceSeqs = jdbcClient.sql(selectSql)
                .params(params)
                .query(Integer.class)
                .list();

        if (matchingSourceSeqs.isEmpty()) {
            return findReviewResults(bidSeq, engineerId, request.relatedProjectHistoryConditions());
        }

        String actor = AuditActorResolver.resolve();
        int displayOrder = nextDisplayOrder(bidSeq, engineerId);
        for (Integer sourceSeq : matchingSourceSeqs) {
            jdbcClient.sql("""
                            INSERT INTO pq_engineer_project_history_review_results (
                                bid_seq, engineer_id, source_seq, display_order, created_id, last_changed_id
                            )
                            VALUES (
                                :bidSeq, :engineerId, :sourceSeq, :displayOrder, :actor, :actor
                            )
                            ON CONFLICT (bid_seq, engineer_id, source_seq)
                            DO NOTHING
                            """)
                    .param("bidSeq", bidSeq)
                    .param("engineerId", engineerId)
                    .param("sourceSeq", sourceSeq)
                    .param("displayOrder", displayOrder++)
                    .param("actor", actor)
                    .update();
        }

        return findReviewResults(bidSeq, engineerId, request.relatedProjectHistoryConditions());
    }

    @Transactional
    public EngineerProjectHistoryReviewResponse updateReviewResult(Long reviewId, EngineerProjectHistoryReviewRequest request) {
        findByReviewId(reviewId);

        Long bidSeq = requiredBidSeq(request.bidSeq());
        String engineerId = required(request.engineerId(), "engineerId");
        Integer sourceSeq = requiredSourceSeq(request.sourceSeq());
        ensureSourceHistoryExists(engineerId, sourceSeq);
        Integer displayOrder = request.displayOrder() == null ? findByReviewId(reviewId).displayOrder() : request.displayOrder();

        String actor = AuditActorResolver.resolve();
        jdbcClient.sql("""
                        UPDATE pq_engineer_project_history_review_results
                        SET bid_seq = :bidSeq,
                            engineer_id = :engineerId,
                            source_seq = :sourceSeq,
                            display_order = :displayOrder,
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = :actor
                        WHERE review_id = :reviewId
                        """)
                .param("reviewId", reviewId)
                .param("bidSeq", bidSeq)
                .param("engineerId", engineerId)
                .param("sourceSeq", sourceSeq)
                .param("displayOrder", displayOrder)
                .param("actor", actor)
                .update();

        return findByReviewId(reviewId);
    }

    @Transactional
    public void deleteReviewResult(Long bidSeq, String engineerId, Long reviewId) {
        int deleted = jdbcClient.sql("""
                        DELETE FROM pq_engineer_project_history_review_results
                        WHERE bid_seq = :bidSeq
                          AND engineer_id = :engineerId
                          AND review_id = :reviewId
                        """)
                .param("bidSeq", requiredBidSeq(bidSeq))
                .param("engineerId", required(engineerId, "engineerId"))
                .param("reviewId", reviewId)
                .update();
        if (deleted != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Review result was not found.");
        }
    }

    private EngineerProjectHistoryReviewResponse findByReviewId(Long reviewId) {
        return jdbcClient.sql("""
                        SELECT
                            r.review_id,
                            r.bid_seq,
                            r.engineer_id,
                            r.source_seq,
                            r.display_order,
                            CAST(h.id AS TEXT) AS id,
                            cp.job_name AS jobname,
                            cp.summary,
                            to_char(to_date(cp.contract_from_date, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) || '~' || chr(10) ||
                                to_char(to_date(cp.contract_to_date, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) ||
                                '(' || to_char(to_date(cp.contract_to_date, 'YYYYMMDD') - to_date(cp.contract_from_date, 'YYYYMMDD'), 'FM999,999,999,999') || '일)' AS contract_term,
                            to_date(cp.contract_to_date, 'YYYYMMDD') - to_date(cp.contract_from_date, 'YYYYMMDD') AS contract_days,
                            to_char(to_date(h.startdt, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) || '~' || chr(10) ||
                                to_char(to_date(h.enddt, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) ||
                                '(' || to_char(to_date(h.enddt, 'YYYYMMDD') - to_date(h.startdt, 'YYYYMMDD'), 'FM999,999,999,999') || '일)' AS work_term,
                            to_date(h.enddt, 'YYYYMMDD') - to_date(h.startdt, 'YYYYMMDD') AS work_days,
                            cp.seq,
                            cp.order_client,
                            cp.contract_amt,
                            cp.own_amt,
                            cp.division_rate,
                            cp.contract_from_date,
                            cp.contract_to_date,
                            h.startdt AS work_from_date,
                            h.enddt AS work_to_date,
                            h.jobclass,
                            h.method,
                            h.jobtag,
                            h.jobpart,
                            h.propart,
                            h.englevel,
                            h.compname,
                            h.deptname,
                            h.grade,
                            h.duty,
                            h.returnyn,
                            h.joinyn,
                            h.join_day,
                            h.part_day,
                            h.select_day,
                            h.remark,
                            r.created_at,
                            r.created_id,
                            r.last_changed_at,
                            r.last_changed_id
                FROM pq_engineer_project_history_review_results r
                JOIN pq_engineer_project_history h
                  ON h.engr_id = r.engineer_id
                 AND h.id = r.source_seq
                        JOIN company_performances cp
                          ON cp.seq = h.seq
                        WHERE r.review_id = :reviewId
                        """)
                .param("reviewId", reviewId)
                .query(this::mapResponse)
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review result was not found."));
    }

    private void ensureSourceHistoryExists(String engineerId, Integer sourceSeq) {
        jdbcClient.sql("""
                        SELECT 1
                        FROM pq_engineer_project_history h
                        JOIN company_performances cp
                          ON cp.seq = h.seq
                        WHERE h.engr_id = :engineerId
                          AND h.id = :sourceSeq
                        """)
                .param("engineerId", engineerId)
                .param("sourceSeq", sourceSeq)
                .query(Integer.class)
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Source project history was not found."));
    }

    private int nextDisplayOrder(Long bidSeq, String engineerId) {
        return jdbcClient.sql("""
                        SELECT COALESCE(MAX(display_order), 0) + 1
                        FROM pq_engineer_project_history_review_results
                        WHERE bid_seq = :bidSeq
                          AND engineer_id = :engineerId
                        """)
                .param("bidSeq", bidSeq)
                .param("engineerId", engineerId)
                .query(Integer.class)
                .single();
    }

    private EngineerProjectHistoryReviewResponse mapResponse(ResultSet rs, int rowNum) throws SQLException {
        return new EngineerProjectHistoryReviewResponse(
                getNullableLong(rs, "review_id"),
                getNullableLong(rs, "bid_seq"),
                rs.getString("engineer_id"),
                getNullableInteger(rs, "source_seq"),
                getNullableInteger(rs, "display_order"),
                rs.getString("id"),
                rs.getString("jobname"),
                rs.getString("summary"),
                rs.getString("contract_term"),
                rs.getString("work_term"),
                formatDays(rs.getObject("work_days")),
                getNullableInteger(rs, "seq"),
                rs.getString("order_client"),
                rs.getBigDecimal("contract_amt"),
                rs.getBigDecimal("own_amt"),
                rs.getBigDecimal("division_rate"),
                rs.getString("contract_from_date"),
                rs.getString("contract_to_date"),
                rs.getString("work_from_date"),
                rs.getString("work_to_date"),
                rs.getString("jobclass"),
                rs.getString("method"),
                rs.getString("jobtag"),
                rs.getString("jobpart"),
                rs.getString("propart"),
                rs.getString("englevel"),
                rs.getString("compname"),
                rs.getString("deptname"),
                rs.getString("grade"),
                rs.getString("duty"),
                rs.getString("returnyn"),
                rs.getString("joinyn"),
                getNullableInteger(rs, "join_day"),
                getNullableInteger(rs, "part_day"),
                getNullableInteger(rs, "select_day"),
                rs.getString("remark"),
                getInstant(rs, "created_at"),
                rs.getString("created_id"),
                getInstant(rs, "last_changed_at"),
                rs.getString("last_changed_id")
        );
    }

    private String buildProjectHistoryConditionSql(List<ProjectHistoryCondition> projectHistoryConditions, Map<String, Object> params) {
        List<String> fragments = new ArrayList<>();
        for (int i = 0; i < projectHistoryConditions.size(); i++) {
            ProjectHistoryCondition condition = projectHistoryConditions.get(i);
            String conditionType = normalize(condition.conditionType());
            String fragment = switch (conditionType == null ? "" : conditionType) {
                case "constructionKind" -> constructionKindCondition(condition, params, i);
                case "general" -> generalCondition(condition, params, i);
                case "outline" -> outlineCondition(condition, params, i);
                default -> "";
            };
            if (!StringUtils.hasText(fragment)) {
                continue;
            }
            String logicalOperator = fragments.isEmpty() ? "" : " " + logicalOperator(condition.logicalOperator()) + " ";
            fragments.add(logicalOperator + fragment);
        }

        if (fragments.isEmpty()) {
            return "";
        }
        return """
                AND (
                %s
                )
                """.formatted(String.join("", fragments));
    }

    private String constructionKindCondition(ProjectHistoryCondition condition, Map<String, Object> params, int index) {
        String level1Code = normalize(condition.level1Code());
        if (!StringUtils.hasText(level1Code)) {
            return "";
        }
        String level1Param = "historyLevel1Code" + index;
        String level2Param = "historyLevel2Code" + index;
        String level3Param = "historyLevel3Code" + index;
        params.put(level1Param, level1Code);
        params.put(level2Param, normalize(condition.level2Code()));
        params.put(level3Param, normalize(condition.level3Code()));
        return """
                h.seq IN (
                    SELECT k.seq
                    FROM company_performance_construction_kinds k
                    WHERE k.level1_code = :%s
                      AND (:%s IS NULL OR k.level2_code = :%s)
                      AND (:%s IS NULL OR k.level3_code = :%s)
                )
                """.formatted(level1Param, level2Param, level2Param, level3Param, level3Param);
    }

    private String generalCondition(ProjectHistoryCondition condition, Map<String, Object> params, int index) {
        String column = GENERAL_COLUMNS.get(normalize(condition.generalCode()));
        if (!StringUtils.hasText(column)) {
            return "";
        }
        String predicate = comparisonPredicate(column, condition, params, index);
        if (!StringUtils.hasText(predicate)) {
            return "";
        }
        if (column.startsWith("h.")) {
            return predicate;
        }
        return """
                h.seq IN (
                    SELECT cp.seq
                    FROM company_performances cp
                    WHERE %s
                )
                """.formatted(predicate);
    }

    private String outlineCondition(ProjectHistoryCondition condition, Map<String, Object> params, int index) {
        String categoryCode = normalize(condition.outlineCategoryCode());
        String subcategoryCode = normalize(condition.outlineSubcategoryCode());
        if (!StringUtils.hasText(categoryCode) && !StringUtils.hasText(subcategoryCode)) {
            return "";
        }

        List<String> outlineConditions = new ArrayList<>();
        if (StringUtils.hasText(categoryCode)) {
            String paramName = "outlineCategoryCode" + index;
            outlineConditions.add("o.cate_code = :" + paramName);
            params.put(paramName, categoryCode);
        }
        if (StringUtils.hasText(subcategoryCode)) {
            String paramName = "outlineSubcategoryCode" + index;
            outlineConditions.add("o.subcate_code = :" + paramName);
            params.put(paramName, subcategoryCode);
        }
        String predicate = comparisonPredicate("o.otln_cont", condition, params, index);
        if (StringUtils.hasText(predicate)) {
            outlineConditions.add(predicate);
        }

        return """
                h.seq IN (
                    SELECT o.seq
                    FROM company_performance_outlines o
                    WHERE %s
                )
                """.formatted(String.join("\nAND ", outlineConditions));
    }

    private String comparisonPredicate(String column, ProjectHistoryCondition condition, Map<String, Object> params, int index) {
        String value = normalize(condition.value());
        String operator = operator(condition.operator());
        if (!StringUtils.hasText(value) && !"LIKE".equals(operator)) {
            return "";
        }

        String valueType = normalize(condition.valueType());
        boolean numberType = "number".equals(valueType) || NUMERIC_COLUMNS.contains(column);
        boolean dateType = "date".equals(valueType);
        String expression = numberType
                ? "CAST(NULLIF(REGEXP_REPLACE(CAST(" + column + " AS TEXT), '[^0-9.-]', '', 'g'), '') AS NUMERIC)"
                : column;
        String paramName = "historyValue" + index;
        String valueToParamName = "historyValueTo" + index;

        if ("LIKE".equals(operator)) {
            if (numberType) {
                params.put(paramName, typedValue(value, paramName, true, false));
                return expression + " = :" + paramName;
            }
            params.put(paramName, "%" + (value == null ? "" : value.toLowerCase(Locale.ROOT)) + "%");
            return "LOWER(CAST(" + column + " AS TEXT)) LIKE :" + paramName;
        }
        if ("BETWEEN".equals(operator)) {
            String valueTo = normalize(condition.valueTo());
            if (!StringUtils.hasText(valueTo)) {
                return "";
            }
            params.put(paramName, typedValue(value, paramName, numberType, dateType));
            params.put(valueToParamName, typedValue(valueTo, valueToParamName, numberType, dateType));
            return expression + " BETWEEN :" + paramName + " AND :" + valueToParamName;
        }

        params.put(paramName, typedValue(value, paramName, numberType, dateType));
        return expression + " " + operator + " :" + paramName;
    }

    private List<ProjectHistoryCondition> parseProjectHistoryConditions(String projectHistoryConditions) {
        if (!StringUtils.hasText(projectHistoryConditions)) {
            return List.of();
        }
        try {
            List<ProjectHistoryCondition> conditions = gson.fromJson(
                    projectHistoryConditions,
                    new TypeToken<List<ProjectHistoryCondition>>() {
                    }.getType()
            );
            return conditions == null ? List.of() : conditions;
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Project history conditions are invalid.", exception);
        }
    }

    private Long requiredBidSeq(Long bidSeq) {
        if (bidSeq == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "bidSeq is required.");
        }
        return bidSeq;
    }

    private Integer requiredSourceSeq(Integer sourceSeq) {
        if (sourceSeq == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sourceSeq is required.");
        }
        return sourceSeq;
    }

    private String required(String value, String fieldName) {
        String normalized = normalize(value);
        if (!StringUtils.hasText(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required.");
        }
        return normalized;
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String operator(String value) {
        String normalized = normalize(value);
        if (!StringUtils.hasText(normalized)) {
            return "=";
        }
        String operator = normalized.toUpperCase(Locale.ROOT);
        if (!COMPARISON_OPERATORS.contains(operator)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported comparison operator.");
        }
        return operator;
    }

    private String logicalOperator(String value) {
        return "OR".equalsIgnoreCase(normalize(value)) ? "OR" : "AND";
    }

    private String formatDays(Object value) {
        if (value == null) {
            return "";
        }
        try {
            long days = new BigDecimal(String.valueOf(value)).longValue();
            return "(" + String.format(Locale.US, "%,d", days) + "일)";
        } catch (NumberFormatException exception) {
            return String.valueOf(value);
        }
    }

    private BigDecimal number(String value, String fieldName) {
        try {
            return new BigDecimal(value.replace(",", ""));
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be numeric.", exception);
        }
    }

    private Object typedValue(String value, String fieldName, boolean numberType, boolean dateType) {
        if (numberType) {
            return number(value, fieldName);
        }
        if (dateType) {
            return value.replaceAll("\\D", "");
        }
        return value;
    }

    private Integer getNullableInteger(ResultSet rs, String column) throws SQLException {
        int value = rs.getInt(column);
        return rs.wasNull() ? null : value;
    }

    private Long getNullableLong(ResultSet rs, String column) throws SQLException {
        long value = rs.getLong(column);
        return rs.wasNull() ? null : value;
    }

    private java.time.Instant getInstant(ResultSet rs, String column) throws SQLException {
        Timestamp timestamp = rs.getTimestamp(column);
        return timestamp == null ? null : timestamp.toInstant();
    }

    private record ProjectHistoryCondition(
            String conditionType,
            String logicalOperator,
            String label,
            String level1Code,
            String level2Code,
            String level3Code,
            String generalCode,
            String outlineCategoryCode,
            String outlineSubcategoryCode,
            String operator,
            String value,
            String valueTo,
            String valueType
    ) {
    }
}
