package com.cheil.cheil_be.adapter.out.persistence.companyperformance;

import com.cheil.cheil_be.application.companyperformance.port.out.CompanyPerformanceHwpxDataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class CompanyPerformanceHwpxDataRepositoryAdapter implements CompanyPerformanceHwpxDataRepository {
    private final JdbcClient jdbcClient;

    @Override
    public Map<Long, String> findContractPeriods(List<Long> performanceSeqs) {
        Map<Long, String> result = new LinkedHashMap<>();
        jdbcClient.sql("""
                        SELECT seq, contract_from_date, contract_to_date
                        FROM company_performance_contract_periods
                        WHERE seq IN (:seqs)
                        ORDER BY seq, sort_seq NULLS LAST, contract_from_date NULLS LAST, id
                        """)
                .param("seqs", performanceSeqs)
                .query((rs, rowNum) -> {
                    String from = rs.getString("contract_from_date");
                    String to = rs.getString("contract_to_date");
                    if (from != null && !from.isBlank() && to != null && !to.isBlank()) {
                        result.merge(rs.getLong("seq"), from + " ~ " + to, (current, next) -> current + "\n" + next);
                    }
                    return rs.getLong("seq");
                })
                .list();
        return result;
    }

    @Override
    public Map<Long, String> findJobRatios(List<Long> performanceSeqs) {
        return jdbcClient.sql("""
                        SELECT seq, job_ratio
                        FROM company_performances
                        WHERE seq IN (:seqs)
                        """)
                .param("seqs", performanceSeqs)
                .query((rs, rowNum) -> Map.entry(rs.getLong("seq"), rs.getString("job_ratio") == null ? "" : rs.getString("job_ratio")))
                .list()
                .stream()
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (first, ignored) -> first, LinkedHashMap::new));
    }

    @Override
    public Map<String, String> findJobTypeNames(List<String> jobTypeCodes) {
        return jdbcClient.sql("""
                        SELECT level2_code, code_name
                        FROM common_codes
                        WHERE code_level = 2
                          AND level1_code = 'ST'
                          AND level2_code IN (:codes)
                        """)
                .param("codes", jobTypeCodes)
                .query((rs, rowNum) -> Map.entry(rs.getString("level2_code"), rs.getString("code_name") == null ? "" : rs.getString("code_name")))
                .list()
                .stream()
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (first, ignored) -> first, LinkedHashMap::new));
    }
}
