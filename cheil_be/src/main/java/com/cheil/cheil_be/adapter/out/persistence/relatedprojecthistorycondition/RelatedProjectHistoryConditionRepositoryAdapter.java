package com.cheil.cheil_be.adapter.out.persistence.relatedprojecthistorycondition;

import com.cheil.cheil_be.application.relatedprojecthistorycondition.RelatedProjectHistoryConditionData;
import com.cheil.cheil_be.application.relatedprojecthistorycondition.port.out.RelatedProjectHistoryConditionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class RelatedProjectHistoryConditionRepositoryAdapter
        implements RelatedProjectHistoryConditionRepository {

    private final JdbcClient jdbcClient;

    @Override
    public Optional<RelatedProjectHistoryConditionData> findByBidSeq(Long bidSeq) {
        return jdbcClient.sql("""
                        SELECT bid_seq,
                               conditions_json,
                               created_at,
                               created_id,
                               last_changed_at,
                               last_changed_id
                        FROM pq_related_project_history_conditions
                        WHERE bid_seq = :bidSeq
                        """)
                .param("bidSeq", bidSeq)
                .query(this::mapData)
                .optional();
    }

    @Override
    public RelatedProjectHistoryConditionData save(
            Long bidSeq,
            String conditionsJson,
            String actor
    ) {
        return jdbcClient.sql("""
                        INSERT INTO pq_related_project_history_conditions (
                            bid_seq,
                            conditions_json,
                            created_id,
                            last_changed_id
                        )
                        VALUES (
                            :bidSeq,
                            :conditionsJson,
                            :actor,
                            :actor
                        )
                        ON CONFLICT (bid_seq)
                        DO UPDATE SET
                            conditions_json = EXCLUDED.conditions_json,
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = EXCLUDED.last_changed_id
                        RETURNING bid_seq,
                                  conditions_json,
                                  created_at,
                                  created_id,
                                  last_changed_at,
                                  last_changed_id
                        """)
                .param("bidSeq", bidSeq)
                .param("conditionsJson", conditionsJson)
                .param("actor", actor)
                .query(this::mapData)
                .single();
    }

    private RelatedProjectHistoryConditionData mapData(ResultSet resultSet, int rowNumber)
            throws SQLException {
        return new RelatedProjectHistoryConditionData(
                resultSet.getLong("bid_seq"),
                resultSet.getString("conditions_json"),
                getInstant(resultSet, "created_at"),
                resultSet.getString("created_id"),
                getInstant(resultSet, "last_changed_at"),
                resultSet.getString("last_changed_id")
        );
    }

    private Instant getInstant(ResultSet resultSet, String column) throws SQLException {
        Timestamp timestamp = resultSet.getTimestamp(column);
        return timestamp == null ? null : timestamp.toInstant();
    }
}
