package com.cheil.cheil_be.adapter.out.persistence.serviceperformance;

import com.cheil.cheil_be.application.serviceperformance.port.in.ServicePerformanceCommand;
import com.cheil.cheil_be.application.serviceperformance.port.in.ServicePerformancePage;
import com.cheil.cheil_be.application.serviceperformance.port.in.ServicePerformancePageQuery;
import com.cheil.cheil_be.application.serviceperformance.port.in.ServicePerformanceView;
import com.cheil.cheil_be.application.serviceperformance.port.out.ServicePerformanceRepository;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Repository
public class ServicePerformanceRepositoryAdapter implements ServicePerformanceRepository {

    private static final String TABLE = "service_performances";
    private final JdbcClient jdbcClient;

    public ServicePerformanceRepositoryAdapter(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    @Override
    public ServicePerformancePage findAll(ServicePerformanceSearch search, ServicePerformancePageQuery pageQuery) {
        StringBuilder where = new StringBuilder("WHERE 1 = 1\n");
        Map<String, Object> params = new LinkedHashMap<>();
        appendWhere(where, params, search);
        String sql = """
                SELECT p.id, p.client_code, p.client_code AS client_name,
                       p.evaluation_score AS amount_reflected_evaluation_score,
                       p.field_name, p.site_name, p.evaluation_date, p.service_amount,
                       p.evaluation_score, p.remark, p.created_at, p.created_id,
                       p.last_changed_at, p.last_changed_id
                FROM %s p
                %s
                ORDER BY p.evaluation_date DESC, p.id DESC
                LIMIT :limit OFFSET :offset
                """.formatted(TABLE, where);
        Map<String, Object> listParams = new LinkedHashMap<>(params);
        listParams.put("limit", pageQuery.size());
        listParams.put("offset", (long) pageQuery.page() * pageQuery.size());
        List<ServicePerformanceView> content = bind(jdbcClient.sql(sql), listParams)
                .query((rs, rowNum) -> mapResponse(rs)).list();
        Long total = bind(jdbcClient.sql("SELECT COUNT(*) FROM %s p %s".formatted(TABLE, where)), params)
                .query(Long.class).single();
        long totalElements = total == null ? 0 : total;
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / pageQuery.size());
        return new ServicePerformancePage(
                content,
                pageQuery.page(),
                pageQuery.size(),
                totalElements,
                totalPages,
                pageQuery.page() == 0,
                totalPages == 0 || pageQuery.page() >= totalPages - 1);
    }

    @Override
    public ServicePerformanceView findById(Long id) {
        return jdbcClient.sql("""
                        SELECT p.id, p.client_code, p.client_code AS client_name,
                               p.evaluation_score AS amount_reflected_evaluation_score,
                               p.field_name, p.site_name, p.evaluation_date, p.service_amount,
                               p.evaluation_score, p.remark, p.created_at, p.created_id,
                               p.last_changed_at, p.last_changed_id
                        FROM %s p WHERE p.id = :id
                        """.formatted(TABLE))
                .param("id", id).query((rs, rowNum) -> mapResponse(rs)).optional().orElse(null);
    }

    @Override
    public Long create(ServicePerformanceCommand request, String actor) {
        return jdbcClient.sql("""
                INSERT INTO %s (client_code, field_name, site_name, evaluation_date,
                                service_amount, evaluation_score, remark, created_id, last_changed_id)
                VALUES (:clientCode, :fieldName, :siteName, :evaluationDate,
                        :serviceAmount, :evaluationScore, :remark, :actor, :actor)
                RETURNING id
                """.formatted(TABLE))
                .param("clientCode", request.clientCode()).param("fieldName", request.fieldName())
                .param("siteName", request.siteName()).param("evaluationDate", request.evaluationDate())
                .param("serviceAmount", request.serviceAmount()).param("evaluationScore", request.evaluationScore())
                .param("remark", request.remark()).param("actor", actor).query(Long.class).single();
    }

    @Override
    public int update(Long id, ServicePerformanceCommand request, String actor) {
        return jdbcClient.sql("""
                UPDATE %s SET client_code = :clientCode, field_name = :fieldName,
                    site_name = :siteName, evaluation_date = :evaluationDate,
                    service_amount = :serviceAmount, evaluation_score = :evaluationScore,
                    remark = :remark, last_changed_at = CURRENT_TIMESTAMP, last_changed_id = :actor
                WHERE id = :id
                """.formatted(TABLE))
                .param("id", id).param("clientCode", request.clientCode()).param("fieldName", request.fieldName())
                .param("siteName", request.siteName()).param("evaluationDate", request.evaluationDate())
                .param("serviceAmount", request.serviceAmount()).param("evaluationScore", request.evaluationScore())
                .param("remark", request.remark()).param("actor", actor).update();
    }

    @Override
    public int delete(Long id) {
        return jdbcClient.sql("DELETE FROM %s WHERE id = :id".formatted(TABLE)).param("id", id).update();
    }

    private void appendWhere(StringBuilder where, Map<String, Object> params, ServicePerformanceSearch search) {
        if (hasText(search.keyword())) {
            where.append("AND (LOWER(COALESCE(p.client_code, '')) LIKE :keyword OR LOWER(COALESCE(p.field_name, '')) LIKE :keyword OR LOWER(COALESCE(p.site_name, '')) LIKE :keyword OR LOWER(COALESCE(p.remark, '')) LIKE :keyword)\n");
            params.put("keyword", "%" + search.keyword().trim().toLowerCase(Locale.ROOT) + "%");
        }
        if (hasText(search.clientCode())) { where.append("AND p.client_code = :clientCode\n"); params.put("clientCode", search.clientCode().trim()); }
        if (hasText(search.fieldName())) { where.append("AND p.field_name LIKE '%' || :fieldName || '%'\n"); params.put("fieldName", search.fieldName().trim()); }
        if (hasText(search.siteName())) { where.append("AND p.site_name LIKE '%' || :siteName || '%'\n"); params.put("siteName", search.siteName().trim()); }
        if (hasText(search.referenceDate())) {
            where.append("AND p.evaluation_date <= :referenceDate\n"); params.put("referenceDate", search.referenceDate());
            if ("3".equals(search.periodType()) || "5".equals(search.periodType())) {
                where.append("AND p.evaluation_date >= :periodLowerDate\n"); params.put("periodLowerDate", search.periodLowerDate());
            }
        }
    }

    private boolean hasText(String value) { return value != null && !value.trim().isEmpty(); }

    private ServicePerformanceView mapResponse(ResultSet rs) throws SQLException {
        return new ServicePerformanceView(
                ((Number) rs.getObject("id")).longValue(), rs.getString("client_code"), rs.getString("client_name"),
                rs.getBigDecimal("amount_reflected_evaluation_score"), rs.getString("field_name"), rs.getString("site_name"),
                rs.getString("evaluation_date"), rs.getBigDecimal("service_amount"), rs.getBigDecimal("evaluation_score"),
                rs.getString("remark"), timestamp(rs.getTimestamp("created_at")), rs.getString("created_id"),
                timestamp(rs.getTimestamp("last_changed_at")), rs.getString("last_changed_id"));
    }

    private String timestamp(Timestamp value) { return value == null ? null : value.toInstant().toString(); }

    private JdbcClient.StatementSpec bind(JdbcClient.StatementSpec statement, Map<String, Object> params) {
        JdbcClient.StatementSpec bound = statement;
        for (var entry : params.entrySet()) bound = bound.param(entry.getKey(), entry.getValue());
        return bound;
    }
}
