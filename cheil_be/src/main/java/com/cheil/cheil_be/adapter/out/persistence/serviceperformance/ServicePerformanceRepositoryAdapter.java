package com.cheil.cheil_be.adapter.out.persistence.serviceperformance;

import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceSearch;
import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceCommand;
import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceView;
import com.cheil.cheil_be.application.serviceperformance.port.out.ServicePerformanceRepository;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;
import java.util.Locale;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
public class ServicePerformanceRepositoryAdapter implements ServicePerformanceRepository {

  private static final String TABLE = "service_performances";
  private static final String SEARCH_WHERE = """
      WHERE (CAST(:keyword AS VARCHAR) IS NULL
             OR LOWER(COALESCE(p.client_code, '')) LIKE CAST(:keyword AS VARCHAR)
             OR LOWER(COALESCE(p.field_name, '')) LIKE CAST(:keyword AS VARCHAR)
             OR LOWER(COALESCE(p.site_name, '')) LIKE CAST(:keyword AS VARCHAR)
             OR LOWER(COALESCE(p.remark, '')) LIKE CAST(:keyword AS VARCHAR))
        AND (CAST(:clientCode AS VARCHAR) IS NULL OR p.client_code = CAST(:clientCode AS VARCHAR))
        AND (CAST(:fieldName AS VARCHAR) IS NULL OR p.field_name LIKE CAST(:fieldName AS VARCHAR))
        AND (CAST(:siteName AS VARCHAR) IS NULL OR p.site_name LIKE CAST(:siteName AS VARCHAR))
        AND (CAST(:referenceDate AS VARCHAR) IS NULL OR p.evaluation_date <= CAST(:referenceDate AS VARCHAR))
        AND (CAST(:periodLowerDate AS VARCHAR) IS NULL OR p.evaluation_date >= CAST(:periodLowerDate AS VARCHAR))
      """;
  private final JdbcClient jdbcClient;

  public ServicePerformanceRepositoryAdapter(JdbcClient jdbcClient) {
    this.jdbcClient = jdbcClient;
  }

  @Override
  public Page<ServicePerformanceView> findAll(
      ServicePerformanceSearch search, Pageable pageable) {
    String sql =
        """
        SELECT p.id, p.client_code, p.client_code AS client_name,
               p.evaluation_score AS amount_reflected_evaluation_score,
               p.field_name, p.site_name, p.evaluation_date, p.service_amount,
               p.evaluation_score, p.remark, p.created_at, p.created_id,
               p.last_changed_at, p.last_changed_id
        FROM %s p
        %s
        ORDER BY p.evaluation_date DESC, p.id DESC
        LIMIT :limit OFFSET :offset
        """
            .formatted(TABLE, SEARCH_WHERE);
    List<ServicePerformanceView> content =
        bindSearch(jdbcClient.sql(sql), search)
            .param("limit", pageable.getPageSize())
            .param("offset", pageable.getOffset())
            .query((rs, rowNum) -> mapResponse(rs))
            .list();
    Long total =
        bindSearch(jdbcClient.sql("SELECT COUNT(*) FROM %s p %s".formatted(TABLE, SEARCH_WHERE)), search)
            .query(Long.class)
            .single();
    return new PageImpl<>(content, pageable, total == null ? 0 : total);
  }

  @Override
  public ServicePerformanceView findById(Long id) {
    return jdbcClient
        .sql(
            """
            SELECT p.id, p.client_code, p.client_code AS client_name,
                   p.evaluation_score AS amount_reflected_evaluation_score,
                   p.field_name, p.site_name, p.evaluation_date, p.service_amount,
                   p.evaluation_score, p.remark, p.created_at, p.created_id,
                   p.last_changed_at, p.last_changed_id
            FROM %s p WHERE p.id = :id
            """
                .formatted(TABLE))
        .param("id", id)
        .query((rs, rowNum) -> mapResponse(rs))
        .optional()
        .orElse(null);
  }

  @Override
  public Long create(ServicePerformanceCommand request, String actor) {
    return jdbcClient
        .sql(
            """
            INSERT INTO %s (client_code, field_name, site_name, evaluation_date,
                            service_amount, evaluation_score, remark, created_id, last_changed_id)
            VALUES (:clientCode, :fieldName, :siteName, :evaluationDate,
                    :serviceAmount, :evaluationScore, :remark, :actor, :actor)
            RETURNING id
            """
                .formatted(TABLE))
        .param("clientCode", request.clientCode())
        .param("fieldName", request.fieldName())
        .param("siteName", request.siteName())
        .param("evaluationDate", request.evaluationDate())
        .param("serviceAmount", request.serviceAmount())
        .param("evaluationScore", request.evaluationScore())
        .param("remark", request.remark())
        .param("actor", actor)
        .query(Long.class)
        .single();
  }

  @Override
  public int update(Long id, ServicePerformanceCommand request, String actor) {
    return jdbcClient
        .sql(
            """
            UPDATE %s SET client_code = :clientCode, field_name = :fieldName,
                site_name = :siteName, evaluation_date = :evaluationDate,
                service_amount = :serviceAmount, evaluation_score = :evaluationScore,
                remark = :remark, last_changed_at = CURRENT_TIMESTAMP, last_changed_id = :actor
            WHERE id = :id
            """
                .formatted(TABLE))
        .param("id", id)
        .param("clientCode", request.clientCode())
        .param("fieldName", request.fieldName())
        .param("siteName", request.siteName())
        .param("evaluationDate", request.evaluationDate())
        .param("serviceAmount", request.serviceAmount())
        .param("evaluationScore", request.evaluationScore())
        .param("remark", request.remark())
        .param("actor", actor)
        .update();
  }

  @Override
  public int delete(Long id) {
    return jdbcClient
        .sql("DELETE FROM %s WHERE id = :id".formatted(TABLE))
        .param("id", id)
        .update();
  }

  private ServicePerformanceView mapResponse(ResultSet rs) throws SQLException {
    return new ServicePerformanceView(
        ((Number) rs.getObject("id")).longValue(),
        rs.getString("client_code"),
        rs.getString("client_name"),
        rs.getBigDecimal("amount_reflected_evaluation_score"),
        rs.getString("field_name"),
        rs.getString("site_name"),
        rs.getString("evaluation_date"),
        rs.getBigDecimal("service_amount"),
        rs.getBigDecimal("evaluation_score"),
        rs.getString("remark"),
        timestamp(rs.getTimestamp("created_at")),
        rs.getString("created_id"),
        timestamp(rs.getTimestamp("last_changed_at")),
        rs.getString("last_changed_id"));
  }

  private String timestamp(Timestamp value) {
    return value == null ? null : value.toInstant().toString();
  }

  private JdbcClient.StatementSpec bindSearch(
      JdbcClient.StatementSpec statement, ServicePerformanceSearch search) {
    String keyword = search.keyword() == null
        ? null
        : "%" + search.keyword().toLowerCase(Locale.ROOT) + "%";
    return statement
        .param("keyword", keyword)
        .param("clientCode", search.clientCode())
        .param("fieldName", contains(search.fieldName()))
        .param("siteName", contains(search.siteName()))
        .param("referenceDate", search.referenceDate())
        .param("periodLowerDate", search.periodLowerDate());
  }

  private String contains(String value) {
    return value == null ? null : "%" + value + "%";
  }
}
