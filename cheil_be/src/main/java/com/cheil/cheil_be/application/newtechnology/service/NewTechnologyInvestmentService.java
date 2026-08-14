package com.cheil.cheil_be.application.newtechnology.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.newtechnology.NewTechnologyInvestmentRequest;
import com.cheil.cheil_be.adapter.in.web.newtechnology.NewTechnologyInvestmentResponse;
import com.cheil.cheil_be.common.security.AuditActorResolver;
import com.cheil.cheil_be.common.text.StringValues;

@Service
@RequiredArgsConstructor
public class NewTechnologyInvestmentService {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private final JdbcClient jdbcClient;

    @Transactional(readOnly = true)
    public Page<NewTechnologyInvestmentResponse> findAll(String yearFrom, String yearTo, Pageable pageable) {
        QueryParts queryParts = buildWhere(yearFrom, yearTo);
        String listSql = """
                SELECT id, investment_year, revenue, total_assets, equity_capital,
                       current_liabilities, fixed_liabilities, current_assets,
                       net_income, total_liabilities, technology_development_investment,
                       remark, created_at, created_id, last_changed_at, last_changed_id
                FROM new_technology_investments
                """ + queryParts.whereSql() + """
                ORDER BY investment_year DESC, id DESC
                LIMIT :limit OFFSET :offset
                """;

        Map<String, Object> listParams = new LinkedHashMap<>(queryParts.params());
        listParams.put("limit", pageable.getPageSize());
        listParams.put("offset", pageable.getOffset());

        List<NewTechnologyInvestmentResponse> content = bindParams(jdbcClient.sql(listSql), listParams)
                .query((rs, rowNum) -> mapInvestmentResponse(rs))
                .list();

        Long total = bindParams(
                jdbcClient.sql("SELECT COUNT(*) FROM new_technology_investments " + queryParts.whereSql()),
                queryParts.params()
        )
                .query(Long.class)
                .single();
        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }

    @Transactional(readOnly = true)
    public NewTechnologyInvestmentResponse findById(Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "id is required.");
        }
        return jdbcClient.sql("""
                        SELECT id, investment_year, revenue, total_assets, equity_capital,
                               current_liabilities, fixed_liabilities, current_assets,
                               net_income, total_liabilities, technology_development_investment,
                               remark, created_at, created_id, last_changed_at, last_changed_id
                        FROM new_technology_investments
                        WHERE id = :id
                        """)
                .param("id", id)
                .query((rs, rowNum) -> mapInvestmentResponse(rs))
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "투자실적을 찾을 수 없습니다."));
    }

    @Transactional
    public NewTechnologyInvestmentResponse create(NewTechnologyInvestmentRequest request) {
        validate(request, null);
        String actor = AuditActorResolver.resolve();
        Long id = jdbcClient.sql("""
                        INSERT INTO new_technology_investments (
                            investment_year, revenue, total_assets, equity_capital,
                            current_liabilities, fixed_liabilities, current_assets,
                            net_income, total_liabilities, technology_development_investment,
                            remark, created_id, last_changed_id
                        )
                        VALUES (
                            :investmentYear, :revenue, :totalAssets, :equityCapital,
                            :currentLiabilities, :fixedLiabilities, :currentAssets,
                            :netIncome, :totalLiabilities, :technologyDevelopmentInvestment,
                            :remark, :actor, :actor
                        )
                        RETURNING id
                        """)
                .param("investmentYear", normalizeYear(request.investmentYear(), "investmentYear", true))
                .param("revenue", request.revenue())
                .param("totalAssets", request.totalAssets())
                .param("equityCapital", request.equityCapital())
                .param("currentLiabilities", request.currentLiabilities())
                .param("fixedLiabilities", request.fixedLiabilities())
                .param("currentAssets", request.currentAssets())
                .param("netIncome", request.netIncome())
                .param("totalLiabilities", request.totalLiabilities())
                .param("technologyDevelopmentInvestment", request.technologyDevelopmentInvestment())
                .param("remark", nullIfBlank(request.remark()))
                .param("actor", actor)
                .query(Long.class)
                .single();
        return findById(id);
    }

    @Transactional
    public NewTechnologyInvestmentResponse update(Long id, NewTechnologyInvestmentRequest request) {
        findById(id);
        validate(request, id);
        String actor = AuditActorResolver.resolve();
        jdbcClient.sql("""
                        UPDATE new_technology_investments
                        SET investment_year = :investmentYear,
                            revenue = :revenue,
                            total_assets = :totalAssets,
                            equity_capital = :equityCapital,
                            current_liabilities = :currentLiabilities,
                            fixed_liabilities = :fixedLiabilities,
                            current_assets = :currentAssets,
                            net_income = :netIncome,
                            total_liabilities = :totalLiabilities,
                            technology_development_investment = :technologyDevelopmentInvestment,
                            remark = :remark,
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = :actor
                        WHERE id = :id
                        """)
                .param("id", id)
                .param("investmentYear", normalizeYear(request.investmentYear(), "investmentYear", true))
                .param("revenue", request.revenue())
                .param("totalAssets", request.totalAssets())
                .param("equityCapital", request.equityCapital())
                .param("currentLiabilities", request.currentLiabilities())
                .param("fixedLiabilities", request.fixedLiabilities())
                .param("currentAssets", request.currentAssets())
                .param("netIncome", request.netIncome())
                .param("totalLiabilities", request.totalLiabilities())
                .param("technologyDevelopmentInvestment", request.technologyDevelopmentInvestment())
                .param("remark", nullIfBlank(request.remark()))
                .param("actor", actor)
                .update();
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        findById(id);
        int deleted = jdbcClient.sql("DELETE FROM new_technology_investments WHERE id = :id")
                .param("id", id)
                .update();
        if (deleted != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "투자실적을 찾을 수 없습니다.");
        }
    }

    private QueryParts buildWhere(String yearFrom, String yearTo) {
        StringBuilder where = new StringBuilder("WHERE 1 = 1\n");
        Map<String, Object> params = new LinkedHashMap<>();

        String normalizedYearFrom = normalizeYear(yearFrom, "yearFrom", false);
        if (StringUtils.hasText(normalizedYearFrom)) {
            where.append("AND investment_year >= :yearFrom\n");
            params.put("yearFrom", normalizedYearFrom);
        }
        String normalizedYearTo = normalizeYear(yearTo, "yearTo", false);
        if (StringUtils.hasText(normalizedYearTo)) {
            where.append("AND investment_year <= :yearTo\n");
            params.put("yearTo", normalizedYearTo);
        }
        return new QueryParts(where.toString(), params);
    }

    private NewTechnologyInvestmentResponse mapInvestmentResponse(ResultSet rs) throws SQLException {
        BigDecimal totalAssets = rs.getBigDecimal("total_assets");
        BigDecimal revenue = rs.getBigDecimal("revenue");
        BigDecimal equityCapital = rs.getBigDecimal("equity_capital");
        BigDecimal currentLiabilities = rs.getBigDecimal("current_liabilities");
        BigDecimal currentAssets = rs.getBigDecimal("current_assets");
        BigDecimal netIncome = rs.getBigDecimal("net_income");
        BigDecimal totalLiabilities = rs.getBigDecimal("total_liabilities");

        return new NewTechnologyInvestmentResponse(
                rs.getLong("id"),
                rs.getString("investment_year"),
                revenue,
                totalAssets,
                equityCapital,
                currentLiabilities,
                rs.getBigDecimal("fixed_liabilities"),
                currentAssets,
                netIncome,
                totalLiabilities,
                rs.getBigDecimal("technology_development_investment"),
                calculateRatio(rs.getBigDecimal("technology_development_investment"), revenue),
                calculateRatio(equityCapital, totalAssets),
                calculateRatio(netIncome, equityCapital),
                calculateRatio(currentAssets, currentLiabilities),
                calculateRatio(totalLiabilities, equityCapital),
                rs.getString("remark"),
                toInstant(rs.getTimestamp("created_at")),
                rs.getString("created_id"),
                toInstant(rs.getTimestamp("last_changed_at")),
                rs.getString("last_changed_id")
        );
    }

    private void validate(NewTechnologyInvestmentRequest request, Long currentId) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }

        String investmentYear = normalizeYear(request.investmentYear(), "investmentYear", true);
        validateUniqueYear(investmentYear, currentId);
        validateNonNegative(request.revenue(), "revenue");
        validateNonNegative(request.totalAssets(), "totalAssets");
        validateNonNegative(request.equityCapital(), "equityCapital");
        validateNonNegative(request.currentLiabilities(), "currentLiabilities");
        validateNonNegative(request.fixedLiabilities(), "fixedLiabilities");
        validateNonNegative(request.currentAssets(), "currentAssets");
        validateNonNegative(request.totalLiabilities(), "totalLiabilities");
        validateNonNegative(request.technologyDevelopmentInvestment(), "technologyDevelopmentInvestment");
        StringValues.validateMaxLength(StringValues.normalize(request.remark()), 1000, "remark");
    }

    private void validateUniqueYear(String investmentYear, Long currentId) {
        String sql = "SELECT COUNT(*) FROM new_technology_investments WHERE investment_year = :investmentYear";
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("investmentYear", investmentYear);
        if (currentId != null) {
            sql += " AND id <> :currentId";
            params.put("currentId", currentId);
        }
        Long count = bindParams(jdbcClient.sql(sql), params).query(Long.class).single();
        if (count != null && count > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 등록된 연도입니다.");
        }
    }

    private BigDecimal calculateRatio(BigDecimal numerator, BigDecimal denominator) {
        if (numerator == null || denominator == null || denominator.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return numerator.multiply(HUNDRED).divide(denominator, 2, RoundingMode.HALF_UP);
    }

    private void validateNonNegative(BigDecimal value, String fieldName) {
        if (value != null && value.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be greater than or equal to 0.");
        }
    }

    private String normalizeYear(String value, String fieldName, boolean required) {
        String normalized = StringValues.normalize(value);
        if (!StringUtils.hasText(normalized)) {
            if (required) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required.");
            }
            return null;
        }
        if (!normalized.matches("\\d{4}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be YYYY.");
        }
        return normalized;
    }

    private String nullIfBlank(String value) {
        String normalized = StringValues.normalize(value);
        return StringUtils.hasText(normalized) ? normalized : null;
    }

    private java.time.Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }

    private JdbcClient.StatementSpec bindParams(JdbcClient.StatementSpec statement, Map<String, Object> params) {
        JdbcClient.StatementSpec bound = statement;
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            bound = bound.param(entry.getKey(), entry.getValue());
        }
        return bound;
    }

    private record QueryParts(String whereSql, Map<String, Object> params) {
    }
}
