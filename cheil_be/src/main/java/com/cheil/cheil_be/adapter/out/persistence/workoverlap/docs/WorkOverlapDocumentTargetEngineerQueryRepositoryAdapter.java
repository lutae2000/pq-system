package com.cheil.cheil_be.adapter.out.persistence.workoverlap.docs;

import com.cheil.cheil_be.application.workoverlap.docs.WorkOverlapDocumentTargetEngineerData;
import com.cheil.cheil_be.application.workoverlap.docs.port.out.WorkOverlapDocumentTargetEngineerQueryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class WorkOverlapDocumentTargetEngineerQueryRepositoryAdapter
        implements WorkOverlapDocumentTargetEngineerQueryRepository {

    private final JdbcClient jdbcClient;

    @Override
    public List<WorkOverlapDocumentTargetEngineerData> find(
            Long bidSeq,
            String workDutyId,
            String keyword
    ) {
        return jdbcClient.sql("""
                        SELECT selected.target_id,
                               selected.bid_seq,
                               selected.work_duty_id,
                               selected.engr_id,
                               CASE LOWER(COALESCE(selected.responsibility, ''))
                                   WHEN '사업책임' THEN 1
                                   WHEN '책임' THEN 2
                                   WHEN '참여' THEN 3
                                   WHEN '실무' THEN 4
                                   ELSE 5
                               END AS responsibility_order,
                               selected.display_order,
                               selected.responsibility,
                               engineer.namekor,
                               engineer.birthday,
                               engineer.deptname,
                               engineer.grade,
                               engineer.dutypart,
                               engineer.propart,
                               engineer.retireyn
                        FROM work_overlap_document_engineers selected
                        LEFT JOIN pq_engineer_master engineer
                          ON engineer.engr_id = selected.engr_id
                        WHERE selected.bid_seq = :bidSeq
                          AND selected.work_duty_id = :workDutyId
                          AND (CAST(:keyword AS VARCHAR) IS NULL
                               OR LOWER(selected.engr_id) LIKE LOWER(CONCAT('%', CAST(:keyword AS VARCHAR), '%'))
                               OR LOWER(COALESCE(engineer.namekor, '')) LIKE LOWER(CONCAT('%', CAST(:keyword AS VARCHAR), '%')))
                        ORDER BY responsibility_order,
                                 CASE WHEN selected.display_order IS NULL THEN 1 ELSE 0 END,
                                 selected.display_order NULLS LAST,
                                 engineer.namekor NULLS LAST,
                                 selected.engr_id
                        """)
                .param("bidSeq", bidSeq)
                .param("workDutyId", workDutyId)
                .param("keyword", keyword)
                .query(this::mapData)
                .list();
    }

    private WorkOverlapDocumentTargetEngineerData mapData(ResultSet resultSet, int rowNumber)
            throws SQLException {
        return new WorkOverlapDocumentTargetEngineerData(
                resultSet.getLong("target_id"),
                resultSet.getLong("bid_seq"),
                resultSet.getString("work_duty_id"),
                resultSet.getString("engr_id"),
                getInteger(resultSet, "display_order"),
                resultSet.getString("responsibility"),
                resultSet.getString("namekor"),
                resultSet.getString("birthday"),
                resultSet.getString("deptname"),
                resultSet.getString("grade"),
                resultSet.getString("dutypart"),
                resultSet.getString("propart"),
                resultSet.getString("retireyn")
        );
    }

    private Integer getInteger(ResultSet resultSet, String column) throws SQLException {
        int value = resultSet.getInt(column);
        return resultSet.wasNull() ? null : value;
    }
}
