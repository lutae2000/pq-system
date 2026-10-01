package com.cheil.cheil_be.adapter.out.persistence.newemployment;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.cheil.cheil_be.application.newemployment.port.in.NewEmploymentMonthlyStatus;
import com.cheil.cheil_be.application.newemployment.port.in.NewEmploymentMonthlyStatusPivot;
import com.cheil.cheil_be.application.newemployment.port.out.NewEmploymentMonthlyStatusReader;

@Repository
@RequiredArgsConstructor
public class JdbcNewEmploymentMonthlyStatusReader implements NewEmploymentMonthlyStatusReader {

    private final JdbcClient jdbcClient;

    @Override
    public List<NewEmploymentMonthlyStatus> findMonthlyStatuses(String baseYearMonth, String departmentCode, int monthCount) {
        return jdbcClient.sql("""
                        WITH months AS (
                            SELECT to_char(
                                       date_trunc('month', to_date(:baseYearMonth || '01', 'YYYYMMDD'))
                                       - make_interval(months => :monthCount)
                                       + make_interval(months => gs),
                                       'YYYY-MM'
                                   ) AS base_year_month
                            FROM generate_series(0, :monthCount - 1) AS gs
                        ),
                        monthly_counts AS (
                            SELECT base_year_month,
                                   COALESCE(SUM(employee_count), 0)::integer AS employee_count,
                                   COALESCE(SUM(new_hire_count), 0)::integer AS new_hire_count,
                                   MAX(id) AS id,
                                   MAX(created_at) AS created_at,
                                   MAX(created_id) AS created_id,
                                   MAX(last_changed_at) AS last_changed_at,
                                   MAX(last_changed_id) AS last_changed_id
                            FROM new_employment_monthly_counts
                            WHERE department_code = :departmentCode
                              AND base_year_month BETWEEN (SELECT MIN(base_year_month) FROM months)
                                                       AND (SELECT MAX(base_year_month) FROM months)
                            GROUP BY base_year_month
                        )
                        SELECT COALESCE(counts.id, 0) AS id,
                               months.base_year_month,
                               COALESCE(counts.employee_count, 0) AS employee_count,
                               COALESCE(counts.new_hire_count, 0) AS new_hire_count,
                               counts.created_at,
                               counts.created_id,
                               counts.last_changed_at,
                               counts.last_changed_id
                        FROM months
                        LEFT JOIN monthly_counts counts ON counts.base_year_month = months.base_year_month
                        ORDER BY months.base_year_month
                        """)
                .param("departmentCode", departmentCode)
                .param("baseYearMonth", baseYearMonth)
                .param("monthCount", monthCount)
                .query((rs, rowNum) -> new NewEmploymentMonthlyStatus(
                        rs.getLong("id"),
                        rs.getString("base_year_month"),
                        rs.getObject("employee_count", Integer.class),
                        rs.getObject("new_hire_count", Integer.class),
                        instant(rs.getTimestamp("created_at")),
                        rs.getString("created_id"),
                        instant(rs.getTimestamp("last_changed_at")),
                        rs.getString("last_changed_id")
                ))
                .list();
    }

    @Override
    public List<NewEmploymentMonthlyStatusPivot> findMonthlyStatusPivot(String baseYearMonth, boolean previousYear) {
        int startOffset = previousYear ? 24 : 12;
        int endOffset = previousYear ? 13 : 1;
        return jdbcClient.sql("""
                        WITH month AS (
                            SELECT TO_CHAR(month_date, 'YYYY-MM') AS year_month
                            FROM generate_series(
                                DATE_TRUNC('month', to_date(:baseYearMonth, 'YYYYMM')) - make_interval(months => :startOffset),
                                DATE_TRUNC('month', to_date(:baseYearMonth, 'YYYYMM')) - make_interval(months => :endOffset),
                                INTERVAL '1 month'
                            ) AS month_date
                        )
                        SELECT m.year_month,
                               coalesce(c.employee_count, 0) employee_count,
                               coalesce(c.new_hire_count, 0) new_hire_count
                        FROM month m
                        left join new_employment_monthly_counts c ON m.year_month = c.base_year_month
                        ORDER BY 1
                        """)
                .param("baseYearMonth", baseYearMonth)
                .param("startOffset", startOffset)
                .param("endOffset", endOffset)
                .query((rs, rowNum) -> new NewEmploymentMonthlyStatusPivot(
                        rs.getString("year_month"),
                        rs.getBigDecimal("employee_count"),
                        rs.getBigDecimal("new_hire_count")
                ))
                .list();
    }

    private static java.time.Instant instant(Timestamp value) {
        return value == null ? null : value.toInstant();
    }
}
