package com.cheil.cheil_be.adapter.out.persistence.relatedprojecthistory.condition;

import com.cheil.cheil_be.application.relatedprojecthistory.condition.RelatedProjectHistoryConditionData;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.port.out.RelatedProjectHistoryConditionRepository;
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
    public Optional<RelatedProjectHistoryConditionData> findByBidSeqAndEmployeeNo(Long bidSeq, String employeeNo) {
        return jdbcClient.sql("""
                        SELECT bid_seq,
                               conditions_json,
                               created_at,
                               created_id,
                               last_changed_at,
                               last_changed_id
                        FROM pq_project_history_search_conditions
                        WHERE bid_seq = :bidSeq
                          AND employee_no = :employeeNo
                        """)
                .param("bidSeq", bidSeq)
                .param("employeeNo", employeeNo)
                .query(this::mapData)
                .optional();
    }

    @Override
    public RelatedProjectHistoryConditionData save(
            Long bidSeq,
            String employeeNo,
            String conditionsJson
    ) {
        return jdbcClient.sql("""
                        INSERT INTO pq_project_history_search_conditions (
                            bid_seq,
                            employee_no,
                            conditions_json,
                            created_id,
                            last_changed_id
                        )
                        VALUES (
                            :bidSeq,
                            :employeeNo,
                            :conditionsJson,
                            :employeeNo,
                            :employeeNo
                        )
                        ON CONFLICT (bid_seq, employee_no)
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
                .param("employeeNo", employeeNo)
                .param("conditionsJson", conditionsJson)
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
