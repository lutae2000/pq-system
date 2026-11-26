package com.cheil.cheil_be.adapter.out.persistence.bidnotice;

import com.cheil.cheil_be.application.bidnotice.model.BidNoticeSubmissionCount;
import com.cheil.cheil_be.application.bidnotice.model.BidNoticeSubmissionDetail;
import com.cheil.cheil_be.application.bidnotice.model.BidNoticeSubmissionDetailQuery;
import com.cheil.cheil_be.application.bidnotice.port.out.BidNoticeSubmissionRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class JdbcBidNoticeSubmissionRepository implements BidNoticeSubmissionRepository {
    private static final String SUBMISSIONS = """
                WITH submissions AS (
                    SELECT bid_seq,
                           NULLIF(BTRIM(department_code), '') AS department_code,
                           SUBSTRING(pq_submit_date, 1, 8) AS submission_date,
                           CAST(SUBSTRING(pq_submit_date, 1, 4) AS INTEGER) AS submission_year,
                           SUBSTRING(pq_submit_date, 5, 2) AS submission_month
                      FROM bid_notices
                     WHERE pq_submit_date >= :startsAt
                       AND pq_submit_date <= :endsAt
                       AND participate_yn = 'Y'
                       AND SUBSTRING(pq_submit_date, 1, 8) ~ '^[0-9]{8}$'
                       AND SUBSTRING(pq_submit_date, 5, 2) BETWEEN :fromMonth AND :throughMonth
                       AND pg_input_is_valid(
                           CONCAT(SUBSTRING(pq_submit_date, 1, 4), '-', SUBSTRING(pq_submit_date, 5, 2),
                                  '-', SUBSTRING(pq_submit_date, 7, 2)), 'date'
                       )
                )
                """;
    private static final String DEPARTMENT_FILTER = """
                FROM submissions
                WHERE :allDepartments OR department_code IS NOT DISTINCT FROM CAST(:departmentCode AS text)
                """;

    private final JdbcClient jdbcClient;

    @Override
    public List<BidNoticeSubmissionCount> countByDepartmentAndYear(int firstYear, int lastYear, int throughMonth) {
        return withPeriod(SUBMISSIONS + """
                SELECT department_code, submission_year, COUNT(*) AS submission_count,
                       COUNT(*) FILTER (WHERE submission_month = :throughMonth) AS monthly_count,
                       GROUPING(department_code) = 1 AS is_total
                  FROM submissions
                 GROUP BY submission_year, ROLLUP(department_code)
                 ORDER BY is_total, department_code NULLS LAST, submission_year
                """, firstYear, lastYear, 1, throughMonth)
                .query((rs, rowNum) -> new BidNoticeSubmissionCount(
                        rs.getString("department_code"), rs.getInt("submission_year"),
                        rs.getLong("submission_count"), rs.getLong("monthly_count"), rs.getBoolean("is_total")))
                .list();
    }

    @Override
    public Page<BidNoticeSubmissionDetail> findDetails(BidNoticeSubmissionDetailQuery query, Pageable pageable) {
        var content = withDetailFilters(SUBMISSIONS + """
                , detail_page AS (
                    SELECT bid_seq, department_code, submission_date
                """ + DEPARTMENT_FILTER + """
                    ORDER BY submission_date DESC, bid_seq DESC
                    LIMIT :limit OFFSET :offset
                )
                SELECT page.bid_seq, b.project_name, page.department_code, page.submission_date, b.g2b_bid_ntce_no,
                       b.participate_yn, b.bid_sucess_yn, b.business_type, b.order_client,
                       client.order_name AS order_client_name, b.announce_date, b.bid_closing_date,
                       b.bid_submission_date, b.bid_date, b.design_amt, b.super_decide_empno
                FROM detail_page page
                JOIN bid_notices b ON b.bid_seq = page.bid_seq
                LEFT JOIN clients client ON client.client_code = b.order_client
                ORDER BY page.submission_date DESC, page.bid_seq DESC
                """, query)
                .param("limit", pageable.getPageSize())
                .param("offset", pageable.getOffset())
                .query((rs, rowNum) -> new BidNoticeSubmissionDetail(
                        rs.getLong("bid_seq"), rs.getString("project_name"), rs.getString("department_code"),
                        rs.getString("submission_date"), rs.getString("g2b_bid_ntce_no"), rs.getString("participate_yn"),
                        rs.getString("bid_sucess_yn"), rs.getString("business_type"), rs.getString("order_client"),
                        rs.getString("order_client_name"), rs.getString("announce_date"), rs.getString("bid_closing_date"),
                        rs.getString("bid_submission_date"), rs.getString("bid_date"), rs.getBigDecimal("design_amt"),
                        rs.getString("super_decide_empno")))
                .list();
        long total = withDetailFilters(SUBMISSIONS + "SELECT COUNT(*) " + DEPARTMENT_FILTER, query)
                .query(Long.class).single();
        return new PageImpl<>(content, pageable, total);
    }

    private JdbcClient.StatementSpec withDetailFilters(String sql, BidNoticeSubmissionDetailQuery query) {
        return withPeriod(sql, query.firstYear(), query.lastYear(), query.fromMonth(), query.throughMonth())
                .param("allDepartments", query.allDepartments())
                .param("departmentCode", query.departmentCode());
    }

    private JdbcClient.StatementSpec withPeriod(String sql, int firstYear, int lastYear, int fromMonth, int throughMonth) {
        return jdbcClient.sql(sql)
                .param("startsAt", "%04d0101".formatted(firstYear))
                .param("endsAt", "%04d12319999".formatted(lastYear))
                .param("fromMonth", "%02d".formatted(fromMonth))
                .param("throughMonth", "%02d".formatted(throughMonth));
    }
}
