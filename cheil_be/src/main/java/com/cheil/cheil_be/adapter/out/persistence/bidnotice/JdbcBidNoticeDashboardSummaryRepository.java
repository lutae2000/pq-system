package com.cheil.cheil_be.adapter.out.persistence.bidnotice;

import java.math.BigDecimal;
import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.cheil.cheil_be.application.bidnotice.model.BidNoticeDashboardSummary;
import com.cheil.cheil_be.application.bidnotice.model.BidNoticeDepartmentSummary;
import com.cheil.cheil_be.application.bidnotice.port.out.BidNoticeDashboardSummaryRepository;

@Repository
@RequiredArgsConstructor
public class JdbcBidNoticeDashboardSummaryRepository implements BidNoticeDashboardSummaryRepository {

    private final JdbcClient jdbcClient;

    @Override
    public BidNoticeDashboardSummary findAnnualSummary(int year) {
        return jdbcClient.sql("""
                SELECT COUNT(*) AS bid_count,
                       COUNT(*) FILTER (WHERE bid_sucess_yn = 'Y') AS success_count,
                       COALESCE(SUM(design_amt) FILTER (WHERE bid_sucess_yn = 'Y'), 0) AS design_amount
                  FROM bid_notices
                 WHERE announce_date >= :startDate
                   AND announce_date < :endDate
                   AND participate_yn = 'Y'
                """)
                .param("startDate", "%04d0101".formatted(year))
                .param("endDate", "%04d0101".formatted(year + 1))
                .query((rs, rowNum) -> new BidNoticeDashboardSummary(
                        rs.getLong("bid_count"),
                        rs.getLong("success_count"),
                        rs.getObject("design_amount", BigDecimal.class)))
                .single();
    }

    @Override
    public List<BidNoticeDepartmentSummary> findAnnualDepartmentSummaries(int year) {
        return jdbcClient.sql("""
                SELECT bn.department_code,
                       COALESCE(d.dept_name, NULLIF(bn.department_code, ''), '미지정') AS department_name,
                       COUNT(*) AS bid_count,
                       COUNT(*) FILTER (WHERE bn.bid_sucess_yn = 'Y') AS success_count,
                       COALESCE(SUM(bn.design_amt) FILTER (WHERE bn.bid_sucess_yn = 'Y'), 0) AS design_amount
                  FROM bid_notices bn
                  LEFT JOIN department d ON d.dept_code = bn.department_code
                 WHERE bn.announce_date >= :startDate
                   AND bn.announce_date < :endDate
                   AND bn.participate_yn = 'Y'
                 GROUP BY bn.department_code, d.dept_name
                 ORDER BY success_count DESC, bid_count DESC, department_name
                """)
                .param("startDate", "%04d0101".formatted(year))
                .param("endDate", "%04d0101".formatted(year + 1))
                .query((rs, rowNum) -> new BidNoticeDepartmentSummary(
                        rs.getString("department_code"),
                        rs.getString("department_name"),
                        rs.getLong("bid_count"),
                        rs.getLong("success_count"),
                        rs.getObject("design_amount", BigDecimal.class)))
                .list();
    }
}
