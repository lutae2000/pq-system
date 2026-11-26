package com.cheil.cheil_be.adapter.out.persistence.engineerperformancedoc;

import com.cheil.cheil_be.adapter.out.persistence.relatedprojecthistory.ProjectHistoryJdbcPredicate;
import com.cheil.cheil_be.application.engineerperformancedoc.model.EngineerProjectHistoryReview;
import com.cheil.cheil_be.application.engineerperformancedoc.port.out.EngineerProjectHistoryRepository;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryCondition;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionMetadata;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class EngineerProjectHistoryJdbcRepository implements EngineerProjectHistoryRepository {
    private final JdbcClient jdbcClient;

    @Override
    public List<EngineerProjectHistoryReview> findHistories(String engineerId, List<ProjectHistoryCondition> conditions,
            Map<String, ProjectHistoryConditionMetadata> metadata) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("engineerId", engineerId.trim());
        String conditionSql = conditionSql(conditions, params, metadata);
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

    @Override
    public void replaceReviewResults(Long bidSeq, List<String> engineerIds, String actor,
            List<ProjectHistoryCondition> conditions, Map<String, ProjectHistoryConditionMetadata> metadata, boolean selectAllWhenEmpty) {
        if (engineerIds.isEmpty()) return;
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("bidSeq", bidSeq);
        params.put("engineerIds", engineerIds);
        params.put("actor", actor);
        String conditionSql = conditionSql(conditions, params, metadata);

        jdbcClient.sql("""
                        DELETE FROM pq_engineer_project_history_review_results
                        WHERE bid_seq = :bidSeq
                          AND engr_id IN (:engineerIds)
                          AND created_id = :actor
                        """)
                .param("bidSeq", bidSeq)
                .param("engineerIds", engineerIds)
                .param("actor", actor)
                .update();

        if (!selectAllWhenEmpty && conditions.isEmpty()) return;
        jdbcClient.sql("""
                        INSERT INTO pq_engineer_project_history_review_results (
                            bid_seq, engr_id, source_seq, display_order, created_id, last_changed_id
                        )
                        SELECT :bidSeq, h.engr_id, h.id,
                               ROW_NUMBER() OVER (PARTITION BY h.engr_id ORDER BY
                                   cp.contract_to_date DESC NULLS LAST, h.enddt DESC NULLS LAST, h.seq DESC, h.id),
                               :actor, :actor
                        FROM pq_engineer_project_history h
                        JOIN company_performances cp ON cp.seq = h.seq
                        WHERE h.engr_id IN (:engineerIds)
                        """ + conditionSql + """
                        ON CONFLICT (bid_seq, engr_id, source_seq, created_id) DO NOTHING
                        """)
                .params(params)
                .update();
    }

    private String conditionSql(List<ProjectHistoryCondition> conditions, Map<String, Object> params,
            Map<String, ProjectHistoryConditionMetadata> metadata) {
        String predicate = ProjectHistoryJdbcPredicate.build(conditions, params, metadata);
        return predicate.isEmpty() ? "" : " AND (" + predicate + ")\n";
    }

    private EngineerProjectHistoryReview mapResponse(ResultSet rs, int rowNum) throws SQLException {
        return new EngineerProjectHistoryReview(
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
