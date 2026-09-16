package com.cheil.cheil_be.adapter.out.persistence.newtechnology;

import com.cheil.cheil_be.adapter.in.web.newtechnology.NewTechnologyInvestmentRequest;
import com.cheil.cheil_be.adapter.in.web.newtechnology.NewTechnologyInvestmentResponse;
import com.cheil.cheil_be.application.newtechnology.port.out.NewTechnologyInvestmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class NewTechnologyInvestmentRepositoryAdapter implements NewTechnologyInvestmentRepository {
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private final JdbcClient jdbcClient;

    @Override
    public Page<NewTechnologyInvestmentResponse> findAll(String yearFrom, String yearTo, Pageable pageable) {
        StringBuilder where = new StringBuilder("WHERE 1 = 1\n");
        Map<String, Object> params = new LinkedHashMap<>();
        if (hasText(yearFrom)) { where.append("AND investment_year >= :yearFrom\n"); params.put("yearFrom", yearFrom); }
        if (hasText(yearTo)) { where.append("AND investment_year <= :yearTo\n"); params.put("yearTo", yearTo); }
        String sql = """
                SELECT id, investment_year, revenue, total_assets, equity_capital, current_liabilities,
                       fixed_liabilities, current_assets, net_income, total_liabilities,
                       technology_development_investment, remark, created_at, created_id, last_changed_at, last_changed_id
                FROM new_technology_investments
                %s ORDER BY investment_year DESC, id DESC LIMIT :limit OFFSET :offset
                """.formatted(where);
        Map<String, Object> listParams = new LinkedHashMap<>(params);
        listParams.put("limit", pageable.getPageSize()); listParams.put("offset", pageable.getOffset());
        List<NewTechnologyInvestmentResponse> content = bind(jdbcClient.sql(sql), listParams).query((rs, rowNum) -> map(rs)).list();
        Long total = bind(jdbcClient.sql("SELECT COUNT(*) FROM new_technology_investments " + where), params).query(Long.class).single();
        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }

    @Override
    public NewTechnologyInvestmentResponse findById(Long id) {
        return jdbcClient.sql("""
                        SELECT id, investment_year, revenue, total_assets, equity_capital, current_liabilities,
                               fixed_liabilities, current_assets, net_income, total_liabilities,
                               technology_development_investment, remark, created_at, created_id, last_changed_at, last_changed_id
                        FROM new_technology_investments WHERE id = :id
                        """).param("id", id).query((rs, rowNum) -> map(rs)).optional().orElse(null);
    }

    @Override
    public Long create(NewTechnologyInvestmentRequest request, String actor) {
        return jdbcClient.sql("""
                INSERT INTO new_technology_investments (investment_year, revenue, total_assets, equity_capital,
                    current_liabilities, fixed_liabilities, current_assets, net_income, total_liabilities,
                    technology_development_investment, remark, created_id, last_changed_id)
                VALUES (:investmentYear, :revenue, :totalAssets, :equityCapital, :currentLiabilities,
                    :fixedLiabilities, :currentAssets, :netIncome, :totalLiabilities,
                    :technologyDevelopmentInvestment, :remark, :actor, :actor) RETURNING id
                """).param("investmentYear", request.investmentYear()).param("revenue", request.revenue())
                .param("totalAssets", request.totalAssets()).param("equityCapital", request.equityCapital())
                .param("currentLiabilities", request.currentLiabilities()).param("fixedLiabilities", request.fixedLiabilities())
                .param("currentAssets", request.currentAssets()).param("netIncome", request.netIncome())
                .param("totalLiabilities", request.totalLiabilities()).param("technologyDevelopmentInvestment", request.technologyDevelopmentInvestment())
                .param("remark", request.remark()).param("actor", actor).query(Long.class).single();
    }

    @Override
    public int update(Long id, NewTechnologyInvestmentRequest request, String actor) {
        return jdbcClient.sql("""
                UPDATE new_technology_investments SET investment_year = :investmentYear, revenue = :revenue,
                    total_assets = :totalAssets, equity_capital = :equityCapital, current_liabilities = :currentLiabilities,
                    fixed_liabilities = :fixedLiabilities, current_assets = :currentAssets, net_income = :netIncome,
                    total_liabilities = :totalLiabilities, technology_development_investment = :technologyDevelopmentInvestment,
                    remark = :remark, last_changed_at = CURRENT_TIMESTAMP, last_changed_id = :actor WHERE id = :id
                """).param("id", id).param("investmentYear", request.investmentYear()).param("revenue", request.revenue())
                .param("totalAssets", request.totalAssets()).param("equityCapital", request.equityCapital())
                .param("currentLiabilities", request.currentLiabilities()).param("fixedLiabilities", request.fixedLiabilities())
                .param("currentAssets", request.currentAssets()).param("netIncome", request.netIncome())
                .param("totalLiabilities", request.totalLiabilities()).param("technologyDevelopmentInvestment", request.technologyDevelopmentInvestment())
                .param("remark", request.remark()).param("actor", actor).update();
    }

    @Override public int delete(Long id) { return jdbcClient.sql("DELETE FROM new_technology_investments WHERE id = :id").param("id", id).update(); }

    @Override
    public boolean existsByInvestmentYear(String investmentYear, Long excludedId) {
        String sql = "SELECT COUNT(*) FROM new_technology_investments WHERE investment_year = :investmentYear";
        Map<String, Object> params = new LinkedHashMap<>(); params.put("investmentYear", investmentYear);
        if (excludedId != null) { sql += " AND id <> :excludedId"; params.put("excludedId", excludedId); }
        Long count = bind(jdbcClient.sql(sql), params).query(Long.class).single();
        return count != null && count > 0;
    }

    private NewTechnologyInvestmentResponse map(ResultSet rs) throws SQLException {
        BigDecimal revenue = rs.getBigDecimal("revenue"), assets = rs.getBigDecimal("total_assets"), equity = rs.getBigDecimal("equity_capital");
        BigDecimal currentLiabilities = rs.getBigDecimal("current_liabilities"), currentAssets = rs.getBigDecimal("current_assets"), income = rs.getBigDecimal("net_income"), liabilities = rs.getBigDecimal("total_liabilities");
        BigDecimal investment = rs.getBigDecimal("technology_development_investment");
        return new NewTechnologyInvestmentResponse(rs.getLong("id"), rs.getString("investment_year"), revenue, assets, equity,
                currentLiabilities, rs.getBigDecimal("fixed_liabilities"), currentAssets, income, liabilities, investment,
                ratio(investment, revenue), ratio(equity, assets), ratio(income, equity), ratio(currentAssets, currentLiabilities), ratio(liabilities, equity),
                rs.getString("remark"), instant(rs.getTimestamp("created_at")), rs.getString("created_id"), instant(rs.getTimestamp("last_changed_at")), rs.getString("last_changed_id"));
    }
    private BigDecimal ratio(BigDecimal numerator, BigDecimal denominator) { return numerator == null || denominator == null || denominator.compareTo(BigDecimal.ZERO) == 0 ? null : numerator.multiply(HUNDRED).divide(denominator, 2, RoundingMode.HALF_UP); }
    private java.time.Instant instant(Timestamp value) { return value == null ? null : value.toInstant(); }
    private boolean hasText(String value) { return value != null && !value.isBlank(); }
    private JdbcClient.StatementSpec bind(JdbcClient.StatementSpec statement, Map<String, Object> params) { JdbcClient.StatementSpec bound = statement; for (var entry : params.entrySet()) bound = bound.param(entry.getKey(), entry.getValue()); return bound; }
}
