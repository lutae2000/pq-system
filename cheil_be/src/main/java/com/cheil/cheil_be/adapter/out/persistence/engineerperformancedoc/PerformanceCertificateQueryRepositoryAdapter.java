package com.cheil.cheil_be.adapter.out.persistence.engineerperformancedoc;

import com.cheil.cheil_be.application.engineerperformancedoc.port.out.PerformanceCertificateQueryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class PerformanceCertificateQueryRepositoryAdapter
        implements PerformanceCertificateQueryRepository {

    private final JdbcClient jdbcClient;

    @Override
    public List<WorkOverlapTarget> findWorkOverlapTargets(Long bidSeq, String workDutyId) {
        return jdbcClient.sql("""
                        SELECT target.engr_id,
                               target.contract_no,
                               engineer.namekor
                        FROM work_overlap_document_targets target
                        LEFT JOIN pq_engineer_master engineer
                          ON engineer.engr_id = target.engr_id
                        WHERE target.bid_seq = :bidSeq
                          AND target.work_duty_id = :workDutyId
                        ORDER BY target.engr_id,
                                 target.display_order NULLS LAST,
                                 target.target_id
                        """)
                .param("bidSeq", bidSeq)
                .param("workDutyId", workDutyId)
                .query((resultSet, rowNumber) -> new WorkOverlapTarget(
                        resultSet.getString("engr_id"),
                        resultSet.getString("contract_no"),
                        resultSet.getString("namekor")
                ))
                .list();
    }

    @Override
    public Optional<String> findProjectName(Long bidSeq) {
        return jdbcClient.sql("""
                        SELECT project_name
                        FROM bid_notices
                        WHERE bid_seq = :bidSeq
                        """)
                .param("bidSeq", bidSeq)
                .query(String.class)
                .optional();
    }
}
