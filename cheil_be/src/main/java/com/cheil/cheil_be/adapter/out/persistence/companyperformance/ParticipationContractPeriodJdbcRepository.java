package com.cheil.cheil_be.adapter.out.persistence.companyperformance;

import com.cheil.cheil_be.application.companyperformance.port.out.ParticipationContractPeriodRepository;
import com.cheil.cheil_be.domain.companyperformance.ParticipationContractPeriod;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ParticipationContractPeriodJdbcRepository implements ParticipationContractPeriodRepository {
    private final JdbcClient jdbcClient;

    @Override
    public Map<Long, ParticipationContractPeriod> findByProjectHistoryIds(List<Long> historyIds) {
        if (historyIds.isEmpty()) {
            return Map.of();
        }

        return jdbcClient.sql("""
                        SELECT history.id,
                               CASE WHEN selected_period.id IS NULL THEN performance.contract_from_date
                                    ELSE selected_period.contract_from_date END AS from_date,
                               CASE WHEN selected_period.id IS NULL THEN performance.contract_to_date
                                    ELSE selected_period.contract_to_date END AS to_date
                        FROM pq_engineer_project_history history
                        JOIN company_performances performance ON performance.seq = history.seq
                        LEFT JOIN company_performance_contract_periods selected_period
                          ON selected_period.seq = history.seq AND selected_period.id = history.contract_period_id
                        WHERE history.id IN (:historyIds)
                          AND (selected_period.id IS NOT NULL OR NOT EXISTS (
                              SELECT 1 FROM company_performance_contract_periods period
                              WHERE period.seq = history.seq
                          ))
                        """)
                .param("historyIds", historyIds)
                .query(rs -> {
                    Map<Long, ParticipationContractPeriod> periods = new HashMap<>();
                    while (rs.next()) {
                        periods.put(rs.getLong("id"), new ParticipationContractPeriod(
                                rs.getString("from_date"), rs.getString("to_date")));
                    }
                    return periods;
                });
    }
}
