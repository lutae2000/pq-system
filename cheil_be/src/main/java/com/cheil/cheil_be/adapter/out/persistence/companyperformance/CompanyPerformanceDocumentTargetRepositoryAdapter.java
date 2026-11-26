package com.cheil.cheil_be.adapter.out.persistence.companyperformance;

import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceDocumentTarget;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceDocumentTargetRepository;
import com.google.gson.Gson;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class CompanyPerformanceDocumentTargetRepositoryAdapter implements CompanyPerformanceDocumentTargetRepository {
    private final JdbcClient jdbcClient;
    private final Gson gson = new Gson();

    @Override
    public List<CompanyPerformanceDocumentTarget> findByBidSeqAndEmployeeNo(Long bidSeq, String employeeNo) {
        return jdbcClient.sql("""
                        SELECT t.target_id, t.company_performance_seq, t.display_order
                        FROM pq_project_history_search_conditions s
                        CROSS JOIN LATERAL jsonb_to_recordset(s.company_targets)
                            AS t(target_id BIGINT, company_performance_seq BIGINT, display_order INTEGER)
                        JOIN company_performances cp ON cp.seq = t.company_performance_seq
                        WHERE s.bid_seq = :bidSeq AND s.employee_no = :employeeNo
                        ORDER BY t.display_order NULLS LAST, t.target_id
                        """)
                .param("bidSeq", bidSeq)
                .param("employeeNo", employeeNo)
                .query((rs, row) -> new CompanyPerformanceDocumentTarget(
                        rs.getLong("target_id"), bidSeq, rs.getLong("company_performance_seq"),
                        rs.getObject("display_order", Integer.class)))
                .list();
    }

    @Override
    public void save(Long bidSeq, String employeeNo, List<CompanyPerformanceDocumentTarget> targets) {
        jdbcClient.sql("""
                        INSERT INTO pq_project_history_search_conditions
                            (bid_seq, employee_no, company_targets, created_id, last_changed_id)
                        SELECT :bidSeq, :employeeNo, COALESCE(jsonb_agg(jsonb_build_object(
                            'target_id', COALESCE(t."targetId", nextval('pq_company_target_id_seq')),
                            'company_performance_seq', t."companyPerformanceSeq",
                            'display_order', t."displayOrder"
                        ) ORDER BY t."displayOrder" NULLS LAST, t."companyPerformanceSeq"), '[]'::jsonb), :employeeNo, :employeeNo
                        FROM jsonb_to_recordset(CAST(:targets AS jsonb))
                            AS t("targetId" BIGINT, "companyPerformanceSeq" BIGINT, "displayOrder" INTEGER)
                        ON CONFLICT (bid_seq, employee_no) DO UPDATE
                            SET company_targets = EXCLUDED.company_targets
                        """)
                .param("bidSeq", bidSeq)
                .param("employeeNo", employeeNo)
                .param("targets", gson.toJson(targets))
                .update();
    }
}
