package com.cheil.cheil_be.application.engineerperformancedoc.service;

import static com.cheil.cheil_be.application.common.validation.InputValues.requiredPositive;
import static com.cheil.cheil_be.application.common.exception.ApplicationException.badRequest;
import static com.cheil.cheil_be.application.common.validation.InputValues.requiredText;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

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
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceContractDatesRepository;
import com.cheil.cheil_be.application.engineerperformancedoc.port.in.ReplaceEngineerReviewResultsUseCase;
import com.cheil.cheil_be.application.engineerperformancedoc.port.out.EngineerProjectHistoryRepository;
import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.common.security.AuditActorResolver;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryCondition;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionJsonCodec;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionMetadata;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionMetadataService;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionValidation;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.port.out.BidSelectionLock;

/** 기술인 실적 문서에 필요한 프로젝트 이력, 검토 결과, 문서 값 설정을 조회·관리하는 서비스. */
@Service
@RequiredArgsConstructor
public class EngineerPerformanceDocumentService implements ReplaceEngineerReviewResultsUseCase {

    private final JdbcClient jdbcClient;
    private final EngineerProjectHistoryRepository projectHistoryRepository;
    private final CurrentActorPort currentActor;
    private final BidSelectionLock selectionLock;
    private final ProjectHistoryConditionMetadataService conditionMetadataService;
    private final ProjectHistoryConditionJsonCodec conditionJsonCodec;
    private final CompanyPerformanceContractDatesRepository companyPerformanceContractDatesRepository;

    @Transactional(readOnly = true)
    public List<EngineerProjectHistoryReviewResponse> findProjectHistories(String engineerId, String relatedProjectHistoryConditions) {
        if (!StringUtils.hasText(engineerId)) return List.of();
        List<ProjectHistoryCondition> conditions = conditionJsonCodec.parse(relatedProjectHistoryConditions);
        var rows = projectHistoryRepository.findHistories(engineerId.trim(), conditions, conditionMetadata(conditions));
        return withContractPeriods(rows.stream().map(EngineerProjectHistoryReviewResponse::from).toList());
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
                    h.jobtag,
                    h.jobpart,
                    h.propart,
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

        var rows = jdbcClient.sql(sql)
                .params(params)
                .query(this::mapResponse)
                .list();
        return withContractPeriods(rows);
    }

    @Transactional
    public EngineerProjectHistoryReviewResponse createReviewResult(EngineerProjectHistoryReviewRequest request) {
        Long bidSeq = requiredPositive(request.bidSeq(), "bidSeq");
        String engineerId = requiredText(request.engineerId(), "engineerId");
        Integer sourceSeq = requiredPositive(request.sourceSeq(), "sourceSeq");
        ensureSourceHistoryExists(engineerId, sourceSeq);
        String actor = AuditActorResolver.resolve();
        Integer displayOrder = request.displayOrder() == null ? nextDisplayOrder(bidSeq, engineerId, actor) : request.displayOrder();
        Long reviewId = jdbcClient.sql("""
                        INSERT INTO pq_engineer_project_history_review_results (
                            bid_seq, engr_id, source_seq, display_order, created_id, last_changed_id
                        )
                        VALUES (
                            :bidSeq, :engineerId, :sourceSeq, :displayOrder, :actor, :actor
                        )
                        ON CONFLICT (bid_seq, engr_id, source_seq, created_id)
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
        Long bidSeq = requiredPositive(request.bidSeq(), "bidSeq");
        String engineerId = requiredText(request.engineerId(), "engineerId");
        List<ProjectHistoryCondition> conditions = conditionJsonCodec.parse(request.relatedProjectHistoryConditions());
        replaceEngineerReviewResults(bidSeq, List.of(engineerId), conditions, true);
        return findReviewResults(bidSeq, engineerId, request.relatedProjectHistoryConditions());
    }

    @Override
    @Transactional
    public void replaceReviewResults(Long bidSeq, List<String> engineerIds, List<ProjectHistoryCondition> conditions) {
        Long requiredBidSeq = requiredPositive(bidSeq, "bidSeq");
        if (engineerIds == null || conditions == null) {
            throw badRequest("적용할 기술인과 조건 목록이 필요합니다.");
        }
        List<String> ids = engineerIds.stream().map(id -> requiredText(id, "engineerId")).distinct().toList();
        replaceEngineerReviewResults(requiredBidSeq, ids, conditions, false);
    }

    private void replaceEngineerReviewResults(Long bidSeq, List<String> engineerIds,
            List<ProjectHistoryCondition> conditions, boolean selectAllWhenEmpty) {
        if (engineerIds.isEmpty()) return;
        selectionLock.lock(bidSeq);
        projectHistoryRepository.replaceReviewResults(bidSeq, engineerIds, currentActor.currentActor(),
                conditions, conditionMetadata(conditions), selectAllWhenEmpty);
    }

    private Map<String, ProjectHistoryConditionMetadata> conditionMetadata(List<ProjectHistoryCondition> conditions) {
        var metadata = conditions.isEmpty() ? Map.<String, ProjectHistoryConditionMetadata>of() : conditionMetadataService.findAll();
        conditions.forEach(condition -> ProjectHistoryConditionValidation.validate(condition, metadata));
        return metadata;
    }

    @Transactional
    public EngineerProjectHistoryReviewResponse updateReviewResult(Long reviewId, EngineerProjectHistoryReviewRequest request) {
        findByReviewId(reviewId);

        Long bidSeq = requiredPositive(request.bidSeq(), "bidSeq");
        String engineerId = requiredText(request.engineerId(), "engineerId");
        Integer sourceSeq = requiredPositive(request.sourceSeq(), "sourceSeq");
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
                          AND created_id = :actor
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
                          AND created_id = :actor
                        """)
                .param("bidSeq", requiredPositive(bidSeq, "bidSeq"))
                .param("engineerId", requiredText(engineerId, "engineerId"))
                .param("reviewId", reviewId)
                .param("actor", currentActor.currentActor())
                .update();
        if (deleted != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Review result was not found.");
        }
    }

    private EngineerProjectHistoryReviewResponse findByReviewId(Long reviewId) {
        var row = jdbcClient.sql("""
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
                            h.jobtag,
                            h.jobpart,
                            h.propart,
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
                          AND r.created_id = :actor
                        """)
                .param("reviewId", reviewId)
                .param("actor", currentActor.currentActor())
                .query(this::mapResponse)
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review result was not found."));
        return withContractPeriods(List.of(row)).getFirst();
    }

    private List<EngineerProjectHistoryReviewResponse> withContractPeriods(List<EngineerProjectHistoryReviewResponse> rows) {
        var projectSeqs = rows.stream().map(EngineerProjectHistoryReviewResponse::seq)
                .filter(java.util.Objects::nonNull).map(Integer::longValue).distinct().toList();
        if (projectSeqs.isEmpty()) return rows;

        var periods = companyPerformanceContractDatesRepository.findContractDatesByPerformanceSeqs(projectSeqs);
        return rows.stream()
                .map(row -> row.seq() == null ? row : row.withContractPeriods(periods.getOrDefault(row.seq().longValue(), List.of())))
                .toList();
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

    private int nextDisplayOrder(Long bidSeq, String engineerId, String actor) {
        return jdbcClient.sql("""
                        SELECT COALESCE(MAX(display_order), 0) + 1
                        FROM pq_engineer_project_history_review_results
                        WHERE bid_seq = :bidSeq
                          AND engr_id = :engineerId
                          AND created_id = :actor
                        """)
                .param("bidSeq", bidSeq)
                .param("engineerId", engineerId)
                .param("actor", actor)
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
                rs.getString("jobtag"),
                rs.getString("jobpart"),
                rs.getString("propart"),
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
                rs.getString("last_changed_id"),
                List.of()
        );
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
