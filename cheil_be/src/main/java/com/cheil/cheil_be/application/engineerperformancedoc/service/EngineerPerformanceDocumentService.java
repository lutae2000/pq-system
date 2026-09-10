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
import com.cheil.cheil_be.adapter.in.web.engineerperformancedoc.EngineerDocumentValueSettingRequest;
import com.cheil.cheil_be.adapter.in.web.engineerperformancedoc.EngineerDocumentValueSettingResponse;
import com.cheil.cheil_be.common.security.AuditActorResolver;
import com.cheil.cheil_be.application.relatedprojecthistorycondition.ProjectHistoryCondition;
import com.cheil.cheil_be.application.relatedprojecthistorycondition.ProjectHistoryConditionMetadata;
import com.cheil.cheil_be.application.relatedprojecthistorycondition.ProjectHistoryConditionMetadataService;

/** 기술인 실적 문서에 필요한 프로젝트 이력, 검토 결과, 문서 값 설정을 조회·관리하는 서비스. */
@Service
@RequiredArgsConstructor
public class EngineerPerformanceDocumentService {

    private static final Set<String> COMPARISON_OPERATORS = Set.of("=", "!=", ">=", "<=", ">", "<", "LIKE", "BETWEEN");
    private final JdbcClient jdbcClient;
    private final ProjectHistoryConditionMetadataService conditionMetadataService;
    private final Gson gson = new Gson();

    @Transactional(readOnly = true)
    public List<EngineerDocumentValueSettingResponse> findDocumentValueSettings(Long bidSeq) {
        if (bidSeq == null) {
            return List.of();
        }
        return jdbcClient.sql("""
                SELECT bid_seq, engr_id, selected_education_id, selected_license_id,
                       created_at, created_id, last_changed_at, last_changed_id
                FROM pq_engineer_document_value_settings
                WHERE bid_seq = :bidSeq
                ORDER BY engr_id
                """)
                .param("bidSeq", bidSeq)
                .query((rs, rowNum) -> new EngineerDocumentValueSettingResponse(
                        rs.getLong("bid_seq"), rs.getString("engr_id"),
                        rs.getObject("selected_education_id", Long.class),
                        rs.getObject("selected_license_id", Long.class),
                        rs.getTimestamp("created_at"), rs.getString("created_id"),
                        rs.getTimestamp("last_changed_at"), rs.getString("last_changed_id")))
                .list();
    }

    @Transactional
    public EngineerDocumentValueSettingResponse saveDocumentValueSetting(EngineerDocumentValueSettingRequest request) {
        Long bidSeq = requiredBidSeq(request.bidSeq());
        String engineerId = required(request.engineerId(), "engineerId");
        if (request.educationId() != null) {
            ensureEngineerDetailExists("pq_engineer_school", request.educationId(), engineerId);
        }
        if (request.licenseId() != null) {
            ensureEngineerDetailExists("pq_engineer_license", request.licenseId(), engineerId);
        }

        String actor = AuditActorResolver.resolve();
        jdbcClient.sql("""
                INSERT INTO pq_engineer_document_value_settings
                    (bid_seq, engr_id, selected_education_id, selected_license_id, created_id, last_changed_id)
                VALUES (:bidSeq, :engineerId, :educationId, :licenseId, :actor, :actor)
                ON CONFLICT (bid_seq, engr_id) DO UPDATE SET
                    selected_education_id = EXCLUDED.selected_education_id,
                    selected_license_id = EXCLUDED.selected_license_id,
                    last_changed_at = CURRENT_TIMESTAMP,
                    last_changed_id = EXCLUDED.last_changed_id
                """)
                .param("bidSeq", bidSeq).param("engineerId", engineerId)
                .param("educationId", request.educationId()).param("licenseId", request.licenseId())
                .param("actor", actor).update();

        return jdbcClient.sql("""
                SELECT bid_seq, engr_id, selected_education_id, selected_license_id,
                       created_at, created_id, last_changed_at, last_changed_id
                FROM pq_engineer_document_value_settings
                WHERE bid_seq = :bidSeq AND engr_id = :engineerId
                """)
                .params(Map.of("bidSeq", bidSeq, "engineerId", engineerId))
                .query((rs, rowNum) -> new EngineerDocumentValueSettingResponse(
                        rs.getLong("bid_seq"), rs.getString("engr_id"),
                        rs.getObject("selected_education_id", Long.class),
                        rs.getObject("selected_license_id", Long.class),
                        rs.getTimestamp("created_at"), rs.getString("created_id"),
                        rs.getTimestamp("last_changed_at"), rs.getString("last_changed_id")))
                .single();
    }

    private void ensureEngineerDetailExists(String tableName, Long detailId, String engineerId) {
        if (!Set.of("pq_engineer_school", "pq_engineer_license").contains(tableName)) {
            throw new IllegalArgumentException("Unsupported engineer detail table");
        }
        boolean exists = jdbcClient.sql("SELECT COUNT(*) > 0 FROM " + tableName + " WHERE id = :detailId AND engr_id = :engineerId")
                .params(Map.of("detailId", detailId, "engineerId", engineerId))
                .query(Boolean.class).single();
        if (!exists) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "선택한 인사정보가 기술인 정보와 일치하지 않습니다.");
        }
    }

    @Transactional(readOnly = true)
    public List<EngineerProjectHistoryReviewResponse> findProjectHistories(
            String engineerId,
            String relatedProjectHistoryConditions
    ) {
        if (!StringUtils.hasText(engineerId)) {
            return List.of();
        }

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("engineerId", engineerId.trim());
        List<ProjectHistoryCondition> conditions = parseProjectHistoryConditions(relatedProjectHistoryConditions);
        String conditionSql = buildProjectHistoryConditionSql(
                conditions,
                params,
                conditions.isEmpty() ? Map.of() : conditionMetadataService.findAll()
        );

        return jdbcClient.sql("""
                        SELECT
                            NULL::BIGINT AS review_id,
                            NULL::BIGINT AS bid_seq,
                            h.engr_id AS engr_id,
                            h.id AS source_seq,
                            NULL::INTEGER AS display_order,
                            CAST(h.id AS TEXT) AS id,
                            cp.job_name AS jobname,
                            cp.summary,
                            to_char(to_date(cp.contract_from_date, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) || '~' || chr(10) ||
                                to_char(to_date(cp.contract_to_date, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) ||
                                '(' || to_char(to_date(cp.contract_to_date, 'YYYYMMDD') - to_date(cp.contract_from_date, 'YYYYMMDD') + 1, 'FM999,999,999,999') || '일)' AS contract_term,
                            to_date(cp.contract_to_date, 'YYYYMMDD') - to_date(cp.contract_from_date, 'YYYYMMDD') + 1 AS contract_days,
                            to_char(to_date(h.startdt, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) || '~' || chr(10) ||
                                to_char(to_date(h.enddt, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) ||
                                '(' || to_char(to_date(h.enddt, 'YYYYMMDD') - to_date(h.startdt, 'YYYYMMDD') + 1, 'FM999,999,999,999') || '일)' AS work_term,
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
                            NULL::INTEGER AS join_day,
                            NULL::INTEGER AS part_day,
                            NULL::INTEGER AS select_day,
                            h.remark,
                            NULL::TIMESTAMP AS created_at,
                            NULL::VARCHAR AS created_id,
                            NULL::TIMESTAMP AS last_changed_at,
                            NULL::VARCHAR AS last_changed_id
                        FROM pq_engineer_project_history h
                        JOIN company_performances cp
                          ON cp.seq = h.seq
                        WHERE h.engr_id = :engineerId
                        """ + conditionSql + """
                        ORDER BY cp.contract_to_date DESC NULLS LAST, h.enddt DESC NULLS LAST, h.seq DESC
                        """)
                .params(params)
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
        params.put("actor", AuditActorResolver.resolve());
        String sql = """
                SELECT
                    r.review_id,
                    r.bid_seq,
                    r.engr_id,
                    r.source_seq,
                    r.display_order,
                    CAST(h.id AS TEXT) AS id,
                    cp.job_name AS jobname,
                    cp.summary,
                    to_char(to_date(cp.contract_from_date, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) || '~' || chr(10) ||
                        to_char(to_date(cp.contract_to_date, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) ||
                        '(' || to_char(to_date(cp.contract_to_date, 'YYYYMMDD') - to_date(cp.contract_from_date, 'YYYYMMDD') + 1, 'FM999,999,999,999') || '일)' AS contract_term,
                    to_date(cp.contract_to_date, 'YYYYMMDD') - to_date(cp.contract_from_date, 'YYYYMMDD') + 1 AS contract_days,
                    to_char(to_date(h.startdt, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) || '~' || chr(10) ||
                        to_char(to_date(h.enddt, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) ||
                        '(' || to_char(to_date(h.enddt, 'YYYYMMDD') - to_date(h.startdt, 'YYYYMMDD') + 1, 'FM999,999,999,999') || '일)' AS work_term,
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
                    NULL::INTEGER AS join_day,
                    NULL::INTEGER AS part_day,
                    NULL::INTEGER AS select_day,
                    h.remark,
                    r.created_at,
                    r.created_id,
                    r.last_changed_at,
                    r.last_changed_id
                FROM pq_engineer_project_history_review_results r
                JOIN pq_engineer_project_history h
                  ON h.engr_id = r.engr_id
                 AND h.id = r.source_seq
                JOIN company_performances cp
                  ON cp.seq = h.seq
                WHERE r.bid_seq = :bidSeq
                  AND r.engr_id = :engineerId
                  AND r.created_id = :actor
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
                            bid_seq, engr_id, source_seq, display_order, created_id, last_changed_id
                        )
                        VALUES (
                            :bidSeq, :engineerId, :sourceSeq, :displayOrder, :actor, :actor
                        )
                        ON CONFLICT (bid_seq, engr_id, source_seq)
                        DO UPDATE SET
                            display_order = EXCLUDED.display_order,
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
        String actor = AuditActorResolver.resolve();
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("bidSeq", bidSeq);
        params.put("engineerId", engineerId);

        jdbcClient.sql("""
                        DELETE FROM pq_engineer_project_history_review_results
                        WHERE bid_seq = :bidSeq
                          AND engr_id = :engineerId
                          AND created_id = :actor
                        """)
                .param("bidSeq", bidSeq)
                .param("engineerId", engineerId)
                .param("actor", actor)
                .update();

        List<ProjectHistoryCondition> conditions = parseProjectHistoryConditions(request.relatedProjectHistoryConditions());
        String conditionSql = buildProjectHistoryConditionSql(
                conditions,
                params,
                conditions.isEmpty() ? Map.of() : conditionMetadataService.findAll()
        );
        String selectSql = """
                SELECT DISTINCT h.id
                FROM pq_engineer_project_history h
                JOIN company_performances cp
                  ON cp.seq = h.seq
                WHERE h.engr_id = :engineerId
                  AND h.id NOT IN (
                      SELECT existing.source_seq
                      FROM pq_engineer_project_history_review_results existing
                      WHERE existing.bid_seq = :bidSeq
                        AND existing.engr_id = :engineerId
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

        int displayOrder = nextDisplayOrder(bidSeq, engineerId);
        for (Integer sourceSeq : matchingSourceSeqs) {
            jdbcClient.sql("""
                            INSERT INTO pq_engineer_project_history_review_results (
                                bid_seq, engr_id, source_seq, display_order, created_id, last_changed_id
                            )
                            VALUES (
                                :bidSeq, :engineerId, :sourceSeq, :displayOrder, :actor, :actor
                            )
                            ON CONFLICT (bid_seq, engr_id, source_seq)
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
                            engr_id = :engineerId,
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
                          AND engr_id = :engineerId
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
                            r.engr_id,
                            r.source_seq,
                            r.display_order,
                            CAST(h.id AS TEXT) AS id,
                            cp.job_name AS jobname,
                            cp.summary,
                            to_char(to_date(cp.contract_from_date, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) || '~' || chr(10) ||
                                to_char(to_date(cp.contract_to_date, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) ||
                                '(' || to_char(to_date(cp.contract_to_date, 'YYYYMMDD') - to_date(cp.contract_from_date, 'YYYYMMDD') + 1, 'FM999,999,999,999') || '일)' AS contract_term,
                            to_date(cp.contract_to_date, 'YYYYMMDD') - to_date(cp.contract_from_date, 'YYYYMMDD') + 1 AS contract_days,
                            to_char(to_date(h.startdt, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) || '~' || chr(10) ||
                                to_char(to_date(h.enddt, 'YYYYMMDD'), 'YY.MM.DD') || chr(10) ||
                                '(' || to_char(to_date(h.enddt, 'YYYYMMDD') - to_date(h.startdt, 'YYYYMMDD') + 1, 'FM999,999,999,999') || '일)' AS work_term,
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
                            NULL::INTEGER AS join_day,
                            NULL::INTEGER AS part_day,
                            NULL::INTEGER AS select_day,
                            h.remark,
                            r.created_at,
                            r.created_id,
                            r.last_changed_at,
                            r.last_changed_id
                FROM pq_engineer_project_history_review_results r
                JOIN pq_engineer_project_history h
                  ON h.engr_id = r.engr_id
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
                          AND engr_id = :engineerId
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
                rs.getString("engr_id"),
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

    private String buildProjectHistoryConditionSql(List<ProjectHistoryCondition> projectHistoryConditions, Map<String, Object> params,
            Map<String, ProjectHistoryConditionMetadata> conditionMetadata) {
        List<String> fragments = new ArrayList<>();
        for (int i = 0; i < projectHistoryConditions.size(); i++) {
            ProjectHistoryCondition condition = projectHistoryConditions.get(i);
            String conditionType = normalize(condition.conditionType());
            String fragment = switch (conditionType == null ? "" : conditionType) {
                case "constructionKind" -> constructionKindCondition(condition, params, i);
                case "general" -> generalCondition(condition, params, i, conditionMetadata);
                case "outline" -> outlineCondition(condition, params, i, conditionMetadata);
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
                AND (%s)
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
        String kindAlias = "k" + index;
        return """
                h.seq IN (
                    SELECT %s.seq
                    FROM company_performance_construction_kinds %s
                    WHERE %s.level1_code = :%s
                      AND (:%s IS NULL OR %s.level2_code = :%s)
                      AND (:%s IS NULL OR %s.level3_code = :%s)
                )
                """.formatted(kindAlias, kindAlias, kindAlias, level1Param, level2Param, kindAlias, level2Param,
                level3Param, kindAlias, level3Param);
    }

    private String generalCondition(ProjectHistoryCondition condition, Map<String, Object> params, int index,
            Map<String, ProjectHistoryConditionMetadata> conditionMetadata) {
        ProjectHistoryConditionMetadata metadata = conditionMetadata.get(normalize(condition.generalCode()));
        String historyAlias = "h" + index;
        String targetAlias = "target" + index;
        String predicate = comparisonPredicate(targetAlias + "." + metadata.column(), condition, params, index, metadata.valueType());
        if (!StringUtils.hasText(predicate)) return "";
        return """
                h.seq IN (
                    SELECT %s.seq
                    FROM %s %s
                    WHERE %s
                )
                """.formatted(targetAlias, metadata.table(), targetAlias, predicate);
    }

    private String outlineCondition(ProjectHistoryCondition condition, Map<String, Object> params, int index,
            Map<String, ProjectHistoryConditionMetadata> conditionMetadata) {
        String categoryCode = normalize(condition.outlineCategoryCode());
        String subcategoryCode = normalize(condition.outlineSubcategoryCode());
        if (!StringUtils.hasText(categoryCode) && !StringUtils.hasText(subcategoryCode)) {
            return "";
        }

        String targetAlias = "target" + index;
        List<String> outlineConditions = new ArrayList<>();
        if (StringUtils.hasText(categoryCode)) {
            String paramName = "outlineCategoryCode" + index;
            outlineConditions.add(targetAlias + ".cate_code = :" + paramName);
            params.put(paramName, categoryCode);
        }
        if (StringUtils.hasText(subcategoryCode)) {
            String paramName = "outlineSubcategoryCode" + index;
            outlineConditions.add(targetAlias + ".subcate_code = :" + paramName);
            params.put(paramName, subcategoryCode);
        }
        ProjectHistoryConditionMetadata metadata = conditionMetadata.get(normalize(categoryCode) + normalize(subcategoryCode));
        if (metadata == null) return "";
        String predicate = comparisonPredicate(targetAlias + "." + metadata.column(), condition, params, index,
                metadata.valueType());
        if (StringUtils.hasText(predicate)) {
            outlineConditions.add(predicate);
        }

        return """
                h.seq IN (
                    SELECT %s.seq
                    FROM %s %s
                    WHERE %s
                )
                """.formatted(targetAlias, metadata.table(), targetAlias, String.join("\nAND ", outlineConditions));
    }

    private String comparisonPredicate(String column, ProjectHistoryCondition condition, Map<String, Object> params, int index) {
        return comparisonPredicate(column, condition, params, index, null);
    }

    private String comparisonPredicate(String column, ProjectHistoryCondition condition, Map<String, Object> params, int index,
            String metadataValueType) {
        String value = normalize(condition.value());
        String operator = operator(condition.operator());
        if (!StringUtils.hasText(value) && !"LIKE".equals(operator)) {
            return "";
        }

        String valueType = StringUtils.hasText(metadataValueType) ? metadataValueType : normalize(condition.valueType());
        boolean numberType = "number".equals(valueType);
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

}
