package com.cheil.cheil_be.application.relatedprojecthistorycondition;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.relatedprojecthistorycondition.RelatedProjectHistoryConditionResponse;
import com.cheil.cheil_be.common.security.AuditActorResolver;

@Service
@RequiredArgsConstructor
public class RelatedProjectHistoryConditionService {

    private final JdbcClient jdbcClient;
    private final Gson gson = new Gson();

    @Transactional(readOnly = true)
    public RelatedProjectHistoryConditionResponse findByBidSeq(Long bidSeq) {
        return jdbcClient.sql("""
                        SELECT
                            bid_seq,
                            conditions_json,
                            created_at,
                            created_id,
                            last_changed_at,
                            last_changed_id
                        FROM pq_related_project_history_conditions
                        WHERE bid_seq = :bidSeq
                        """)
                .param("bidSeq", bidSeq)
                .query(this::mapResponse)
                .optional()
                .orElseGet(() -> new RelatedProjectHistoryConditionResponse(bidSeq, "[]", null, null, null, null));
    }

    @Transactional
    public RelatedProjectHistoryConditionResponse save(Long bidSeq, String conditionsJson) {
        String normalizedJson = normalizeConditionsJson(conditionsJson);
        String actor = AuditActorResolver.resolve();

        return jdbcClient.sql("""
                        INSERT INTO pq_related_project_history_conditions (
                            bid_seq, conditions_json, created_id, last_changed_id
                        )
                        VALUES (
                            :bidSeq, :conditionsJson, :actor, :actor
                        )
                        ON CONFLICT (bid_seq)
                        DO UPDATE SET
                            conditions_json = EXCLUDED.conditions_json,
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = EXCLUDED.last_changed_id
                        RETURNING
                            bid_seq,
                            conditions_json,
                            created_at,
                            created_id,
                            last_changed_at,
                            last_changed_id
                        """)
                .param("bidSeq", bidSeq)
                .param("conditionsJson", normalizedJson)
                .param("actor", actor)
                .query(this::mapResponse)
                .single();
    }

    private String normalizeConditionsJson(String conditionsJson) {
        if (!StringUtils.hasText(conditionsJson)) {
            return "[]";
        }

        try {
            List<ProjectHistoryCondition> conditions = gson.fromJson(
                    conditionsJson,
                    new TypeToken<List<ProjectHistoryCondition>>() {
                    }.getType()
            );
            return gson.toJson(conditions == null ? List.of() : conditions);
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Related project history conditions are invalid.", exception);
        }
    }

    private RelatedProjectHistoryConditionResponse mapResponse(ResultSet rs, int rowNum) throws SQLException {
        return new RelatedProjectHistoryConditionResponse(
                rs.getLong("bid_seq"),
                rs.getString("conditions_json"),
                getInstant(rs, "created_at"),
                rs.getString("created_id"),
                getInstant(rs, "last_changed_at"),
                rs.getString("last_changed_id")
        );
    }

    private Instant getInstant(ResultSet rs, String column) throws SQLException {
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
