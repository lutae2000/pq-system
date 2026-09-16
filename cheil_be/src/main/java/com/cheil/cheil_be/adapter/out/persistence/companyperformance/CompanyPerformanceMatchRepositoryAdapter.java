package com.cheil.cheil_be.adapter.out.persistence.companyperformance;

import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceMatchResponse;
import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceMatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class CompanyPerformanceMatchRepositoryAdapter implements CompanyPerformanceMatchRepository {
    private final JdbcClient jdbcClient;

    @Override
    public List<CompanyPerformanceMatchResponse.Candidate> findCandidates() {
        return jdbcClient.sql("""
                        SELECT seq, job_name, job_own_yn, summary, order_client, job_type, contract_amt, remark
                        FROM company_performances
                        WHERE NULLIF(TRIM(job_name), '') IS NOT NULL
                        """)
                .query((rs, rowNum) -> new CompanyPerformanceMatchResponse.Candidate(
                        rs.getLong("seq"),
                        rs.getString("job_name"),
                        "Y".equalsIgnoreCase(rs.getString("job_own_yn")),
                        0,
                        rs.getString("summary"),
                        rs.getString("order_client"),
                        rs.getString("job_type"),
                        rs.getObject("contract_amt", Long.class),
                        rs.getString("remark")
                ))
                .list();
    }
}
