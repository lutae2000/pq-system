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
    public List<PerformanceTarget> findPerformanceTargets(Long bidSeq, List<String> engineerIds, String actor) {
        if (engineerIds == null || engineerIds.isEmpty()) {
            return List.of();
        }
        return jdbcClient.sql("""
                        SELECT r.engr_id,
                               cp.seq AS performance_seq,
                               r.display_order,
                               r.review_id
                        FROM pq_engineer_project_history_review_results r
                        JOIN pq_engineer_project_history h
                          ON h.engr_id = r.engr_id
                         AND h.id = r.source_seq
                        JOIN company_performances cp
                          ON cp.seq = h.seq
                        WHERE r.bid_seq = :bidSeq
                          AND r.engr_id IN (:engineerIds)
                          AND r.created_id = :actor
                        """)
                .param("bidSeq", bidSeq)
                .param("engineerIds", engineerIds)
                .param("actor", actor)
                .query((resultSet, rowNumber) -> new PerformanceTarget(
                        resultSet.getString("engr_id"),
                        resultSet.getLong("performance_seq"),
                        resultSet.getObject("display_order", Integer.class),
                        resultSet.getLong("review_id")
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
