package com.cheil.cheil_be.adapter.out.persistence.serviceperformance;

import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceSearch;
import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceCommand;
import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceView;
import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceImportRow;
import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceImportView;
import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceImportSearch;
import com.cheil.cheil_be.application.serviceperformance.port.out.ServicePerformanceRepository;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;
import java.util.Locale;
import java.util.LinkedHashMap;
import java.util.Map;
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
  public Page<ServicePerformanceImportView> findImported(ServicePerformanceImportSearch search, Pageable pageable) {
    StringBuilder where = new StringBuilder(" WHERE construction_no IS NOT NULL");
    Map<String, Object> params = new LinkedHashMap<>();
    addImportedFilter(where, params, "client", search.client());
    addImportedFilter(where, params, "service_name", search.serviceName());
    addImportedFilter(where, params, "service_category", search.serviceCategory());
    addImportedFilter(where, params, "detail_field", search.detailField());
    Map<String, Object> listParams = new LinkedHashMap<>(params);
    listParams.put("limit", pageable.getPageSize());
    listParams.put("offset", pageable.getOffset());
    List<ServicePerformanceImportView> content = bindImported(jdbcClient.sql("""
        SELECT id, construction_no, client, service_name, service_category, detail_field,
               service_fee_thousand, service_start_date, service_end_date, share_rate,
               service_amount_million, score, evaluation_end_date,
               (SELECT created_at FROM service_performances WHERE construction_no IS NOT NULL ORDER BY created_at DESC, id DESC LIMIT 1) AS uploaded_at,
               (SELECT created_id FROM service_performances WHERE construction_no IS NOT NULL ORDER BY created_at DESC, id DESC LIMIT 1) AS uploaded_by
        FROM service_performances
        """ + where + " ORDER BY evaluation_end_date DESC NULLS LAST, id DESC LIMIT :limit OFFSET :offset"), listParams)
        .query((rs, rowNum) -> new ServicePerformanceImportView(rs.getLong("id"),
            rs.getString("construction_no"), rs.getString("client"), rs.getString("service_name"),
            rs.getString("service_category"), rs.getString("detail_field"),
            rs.getBigDecimal("service_fee_thousand"), rs.getString("service_start_date"),
            rs.getString("service_end_date"), rs.getBigDecimal("share_rate"),
            rs.getBigDecimal("service_amount_million"), rs.getBigDecimal("score"),
            rs.getString("evaluation_end_date"), rs.getTimestamp("uploaded_at") == null ? null : rs.getTimestamp("uploaded_at").toInstant(),
            rs.getString("uploaded_by"))).list();
    long total = bindImported(jdbcClient.sql("SELECT COUNT(*) FROM service_performances" + where), params)
        .query(Long.class).single();
    return new PageImpl<>(content, pageable, total);
  }

  private void addImportedFilter(StringBuilder where, Map<String, Object> params, String column, String value) {
    if (value == null) return;
    where.append(" AND LOWER(COALESCE(").append(column).append(", '')) LIKE :").append(column);
    params.put(column, "%" + value.toLowerCase(Locale.ROOT) + "%");
  }

  private JdbcClient.StatementSpec bindImported(JdbcClient.StatementSpec statement, Map<String, Object> params) {
    for (var entry : params.entrySet()) statement = statement.param(entry.getKey(), entry.getValue());
    return statement;
  }

  @Override
  public void replaceImported(List<ServicePerformanceImportRow> rows, String actor) {
    jdbcClient.sql("DELETE FROM service_performances").update();
    for (ServicePerformanceImportRow row : rows) {
      jdbcClient.sql("""
          INSERT INTO service_performances (construction_no, client, service_name, service_category,
              detail_field, service_fee_thousand, service_start_date, service_end_date, share_rate,
              service_amount_million, score, evaluation_end_date, created_id, last_changed_id)
          VALUES (:constructionNo, :client, :serviceName, :serviceCategory, :detailField,
              :serviceFeeThousand, :serviceStartDate, :serviceEndDate, :shareRate,
              :serviceAmountMillion, :score, :evaluationEndDate, :actor, :actor)
          """)
          .param("constructionNo", row.constructionNo()).param("client", row.client())
          .param("serviceName", row.serviceName()).param("serviceCategory", row.serviceCategory())
          .param("detailField", row.detailField()).param("serviceFeeThousand", row.serviceFeeThousand())
          .param("serviceStartDate", row.serviceStartDate()).param("serviceEndDate", row.serviceEndDate())
          .param("shareRate", row.shareRate()).param("serviceAmountMillion", row.serviceAmountMillion())
          .param("score", row.score()).param("evaluationEndDate", row.evaluationEndDate())
          .param("actor", actor).update();
    }
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
