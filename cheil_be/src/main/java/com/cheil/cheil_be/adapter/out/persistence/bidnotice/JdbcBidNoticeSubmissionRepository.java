package com.cheil.cheil_be.adapter.out.persistence.bidnotice;

import com.cheil.cheil_be.application.bidnotice.model.BidNoticeSubmissionCount;
import com.cheil.cheil_be.application.bidnotice.port.out.BidNoticeSubmissionRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class JdbcBidNoticeSubmissionRepository implements BidNoticeSubmissionRepository {
    private final JdbcClient jdbcClient;

    @Override
    public List<BidNoticeSubmissionCount> countByDepartmentAndYear(int firstYear, int lastYear, int throughMonth) {
        return jdbcClient.sql("""
                WITH submissions AS (
                    SELECT NULLIF(BTRIM(department_code), '') AS department_code,
                           CAST(SUBSTRING(pq_submit_date, 1, 4) AS INTEGER) AS submission_year
                      FROM bid_notices
                     WHERE pq_submit_date >= :startsAt
                       AND pq_submit_date <= :endsAt
                       AND participate_yn = 'Y'
                       AND SUBSTRING(pq_submit_date, 1, 8) ~ '^[0-9]{8}$'
                       AND SUBSTRING(pq_submit_date, 5, 2) <= :throughMonth
                       AND pg_input_is_valid(
                           CONCAT(SUBSTRING(pq_submit_date, 1, 4), '-', SUBSTRING(pq_submit_date, 5, 2),
                                  '-', SUBSTRING(pq_submit_date, 7, 2)), 'date'
                       )
                )
                SELECT department_code, submission_year, COUNT(*) AS submission_count,
                       GROUPING(department_code) = 1 AS is_total
                  FROM submissions
                 GROUP BY submission_year, ROLLUP(department_code)
                 ORDER BY is_total, department_code NULLS LAST, submission_year
                """)
                .param("startsAt", "%04d0101".formatted(firstYear))
                .param("endsAt", "%04d12319999".formatted(lastYear))
                .param("throughMonth", "%02d".formatted(throughMonth))
                .query((rs, rowNum) -> new BidNoticeSubmissionCount(
                        rs.getString("department_code"), rs.getInt("submission_year"),
                        rs.getLong("submission_count"), rs.getBoolean("is_total")))
                .list();
    }
}
