package com.cheil.cheil_be.application.serviceperformance.service;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
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

import com.cheil.cheil_be.adapter.in.web.serviceperformance.ServicePerformanceRequest;
import com.cheil.cheil_be.adapter.in.web.serviceperformance.ServicePerformanceResponse;
import com.cheil.cheil_be.common.security.AuditActorResolver;
import com.cheil.cheil_be.common.text.StringValues;

@Service
@RequiredArgsConstructor
public class ServicePerformanceService {

    private static final int REMARK_MAX_LENGTH = 1000;
    private static final String TABLE = "service_performances";
    private static final DateTimeFormatter BASIC_DATE = DateTimeFormatter.BASIC_ISO_DATE;

    private final JdbcClient jdbcClient;

    @Transactional(readOnly = true)
    public Page<ServicePerformanceResponse> findAll(
            String keyword,
            String clientCode,
            String fieldName,
            String siteName,
            String referenceDate,
            String periodType,
            Pageable pageable
    ) {
        StringBuilder where = new StringBuilder("WHERE 1 = 1\n");
        Map<String, Object> params = new LinkedHashMap<>();
        appendWhere(where, params, keyword, clientCode, fieldName, siteName, referenceDate, periodType);
        String listSql = """
                SELECT p.id,
                       p.client_code,
                       p.client_code AS client_name,
                       p.evaluation_score AS amount_reflected_evaluation_score,
                       p.field_name,
                       p.site_name,
                       p.evaluation_date,
                       p.service_amount,
                       p.evaluation_score,
                       p.remark,
                       p.created_at,
                       p.created_id,
                       p.last_changed_at,
                       p.last_changed_id
                FROM %s p
                %s
                ORDER BY p.evaluation_date DESC, p.id DESC
                LIMIT :limit OFFSET :offset
                """.formatted(TABLE, where);

        Map<String, Object> listParams = new LinkedHashMap<>(params);
        listParams.put("limit", pageable.getPageSize());
        listParams.put("offset", pageable.getOffset());

        List<ServicePerformanceResponse> content = bindParams(jdbcClient.sql(listSql), listParams)
                .query((rs, rowNum) -> mapResponse(rs))
                .list();

        Long total = bindParams(
                jdbcClient.sql("""
                        SELECT COUNT(*)
                        FROM %s p
                        %s
                        """.formatted(TABLE, where)),
                params
        )
                .query(Long.class)
                .single();

        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }

    @Transactional(readOnly = true)
    public ServicePerformanceResponse findById(Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "id is required.");
        }
        return jdbcClient.sql("""
                        SELECT p.id,
                               p.client_code,
                               p.client_code AS client_name,
                               p.evaluation_score AS amount_reflected_evaluation_score,
                               p.field_name,
                               p.site_name,
                               p.evaluation_date,
                               p.service_amount,
                               p.evaluation_score,
                               p.remark,
                               p.created_at,
                               p.created_id,
                               p.last_changed_at,
                               p.last_changed_id
                        FROM %s p
                        WHERE p.id = :id
                        """.formatted(TABLE))
                .param("id", id)
                .query((rs, rowNum) -> mapResponse(rs))
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "용역 수행성과를 찾을 수 없습니다."));
    }

    @Transactional
    public ServicePerformanceResponse create(ServicePerformanceRequest request) {
        validate(request);
        String actor = AuditActorResolver.resolve();
        Long id = jdbcClient.sql("""
                        INSERT INTO %s (
                            client_code,
                            field_name,
                            site_name,
                            evaluation_date,
                            service_amount,
                            evaluation_score,
                            remark,
                            created_id,
                            last_changed_id
                        ) VALUES (
                            :clientCode,
                            :fieldName,
                            :siteName,
                            :evaluationDate,
                            :serviceAmount,
                            :evaluationScore,
                            :remark,
                            :actor,
                            :actor
                        )
                        RETURNING id
                        """.formatted(TABLE))
                .param("clientCode", normalizeRequired(request.clientCode(), "발주청"))
                .param("fieldName", normalizeRequired(request.fieldName(), "분야"))
                .param("siteName", normalizeRequired(request.siteName(), "현장명"))
                .param("evaluationDate", normalizeDate(request.evaluationDate(), "evaluationDate"))
                .param("serviceAmount", request.serviceAmount())
                .param("evaluationScore", request.evaluationScore())
                .param("remark", nullIfBlank(request.remark()))
                .param("actor", actor)
                .query(Long.class)
                .single();
        return findById(id);
    }

    @Transactional
    public ServicePerformanceResponse update(Long id, ServicePerformanceRequest request) {
        findById(id);
        validate(request);
        String actor = AuditActorResolver.resolve();
        int updated = jdbcClient.sql("""
                        UPDATE %s
                        SET client_code = :clientCode,
                            field_name = :fieldName,
                            site_name = :siteName,
                            evaluation_date = :evaluationDate,
                            service_amount = :serviceAmount,
                            evaluation_score = :evaluationScore,
                            remark = :remark,
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = :actor
                        WHERE id = :id
                        """.formatted(TABLE))
                .param("id", id)
                .param("clientCode", normalizeRequired(request.clientCode(), "발주청"))
                .param("fieldName", normalizeRequired(request.fieldName(), "분야"))
                .param("siteName", normalizeRequired(request.siteName(), "현장명"))
                .param("evaluationDate", normalizeDate(request.evaluationDate(), "evaluationDate"))
                .param("serviceAmount", request.serviceAmount())
                .param("evaluationScore", request.evaluationScore())
                .param("remark", nullIfBlank(request.remark()))
                .param("actor", actor)
                .update();
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "용역 수행성과를 찾을 수 없습니다.");
        }
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        findById(id);
        int deleted = jdbcClient.sql("DELETE FROM %s WHERE id = :id".formatted(TABLE))
                .param("id", id)
                .update();
        if (deleted != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "용역 수행성과를 찾을 수 없습니다.");
        }
    }

    private void appendWhere(
            StringBuilder where,
            Map<String, Object> params,
            String keyword,
            String clientCode,
            String fieldName,
            String siteName,
            String referenceDate,
            String periodType
    ) {
        if (StringUtils.hasText(keyword)) {
            where.append("""
                    AND (
                        LOWER(COALESCE(p.client_code, '')) LIKE :keyword
                        OR LOWER(COALESCE(p.field_name, '')) LIKE :keyword
                        OR LOWER(COALESCE(p.site_name, '')) LIKE :keyword
                        OR LOWER(COALESCE(p.remark, '')) LIKE :keyword
                    )
                    """);
            params.put("keyword", "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%");
        }
        if (StringUtils.hasText(clientCode)) {
            where.append("AND p.client_code = :clientCode\n");
            params.put("clientCode", clientCode.trim());
        }
        if (StringUtils.hasText(fieldName)) {
            where.append("AND p.field_name LIKE '%' || :fieldName || '%'\n");
            params.put("fieldName", fieldName.trim());
        }
        if (StringUtils.hasText(siteName)) {
            where.append("AND p.site_name LIKE '%' || :siteName || '%'\n");
            params.put("siteName", siteName.trim());
        }
        String normalizedReferenceDate = normalizeQueryDate(referenceDate);
        String normalizedPeriodType = normalizePeriodType(periodType);
        if (normalizedReferenceDate != null) {
            where.append("AND p.evaluation_date <= :referenceDate\n");
            params.put("referenceDate", normalizedReferenceDate);
            String lowerDate = resolvePeriodLowerDate(normalizedReferenceDate, normalizedPeriodType);
            if (lowerDate != null) {
                where.append("AND p.evaluation_date >= :periodLowerDate\n");
                params.put("periodLowerDate", lowerDate);
            }
        }
    }

    private ServicePerformanceResponse mapResponse(ResultSet rs) throws SQLException {
        return new ServicePerformanceResponse(
                getNullableLong(rs, "id"),
                rs.getString("client_code"),
                rs.getString("client_name"),
                rs.getBigDecimal("amount_reflected_evaluation_score"),
                rs.getString("field_name"),
                rs.getString("site_name"),
                rs.getString("evaluation_date"),
                rs.getBigDecimal("service_amount"),
                rs.getBigDecimal("evaluation_score"),
                rs.getString("remark"),
                toStringTimestamp(rs.getTimestamp("created_at")),
                rs.getString("created_id"),
                toStringTimestamp(rs.getTimestamp("last_changed_at")),
                rs.getString("last_changed_id")
        );
    }

    private void validate(ServicePerformanceRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }
        normalizeRequired(request.clientCode(), "발주청");
        normalizeRequired(request.fieldName(), "분야");
        normalizeRequired(request.siteName(), "현장명");
        normalizeDate(request.evaluationDate(), "evaluationDate");
        StringValues.validateMaxLength(StringValues.normalize(request.remark()), REMARK_MAX_LENGTH, "remark");
    }

    private String normalizeRequired(String value, String fieldName) {
        return StringValues.required(value, fieldName);
    }

    private String normalizeDate(String value, String fieldName) {
        String normalized = StringValues.required(value, fieldName).replace("-", "");
        if (!normalized.matches("\\d{8}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be YYYYMMDD.");
        }
        return normalized;
    }

    private String normalizeQueryDate(String value) {
        String normalized = StringValues.normalize(value).replace("-", "");
        if (!StringUtils.hasText(normalized)) {
            return null;
        }
        if (!normalized.matches("\\d{8}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "referenceDate must be YYYYMMDD.");
        }
        return normalized;
    }

    private String normalizePeriodType(String value) {
        String normalized = StringValues.normalize(value);
        if (!StringUtils.hasText(normalized)) {
            return null;
        }
        String upper = normalized.toUpperCase(Locale.ROOT);
        if (!"3".equals(upper) && !"5".equals(upper) && !"ALL".equals(upper)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "periodType must be 3, 5, or ALL.");
        }
        return upper;
    }

    private String resolvePeriodLowerDate(String referenceDate, String periodType) {
        if (!"3".equals(periodType) && !"5".equals(periodType)) {
            return null;
        }
        int years = Integer.parseInt(periodType);
        return LocalDate.parse(referenceDate, BASIC_DATE).minusYears(years).format(BASIC_DATE);
    }

    private String nullIfBlank(String value) {
        String normalized = StringValues.normalize(value);
        return StringUtils.hasText(normalized) ? normalized : null;
    }

    private Long getNullableLong(ResultSet rs, String column) throws SQLException {
        Object value = rs.getObject(column);
        if (value == null) {
            return null;
        }
        return ((Number) value).longValue();
    }

    private String toStringTimestamp(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant().toString();
    }

    private JdbcClient.StatementSpec bindParams(JdbcClient.StatementSpec statement, Map<String, Object> params) {
        JdbcClient.StatementSpec bound = statement;
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            bound = bound.param(entry.getKey(), entry.getValue());
        }
        return bound;
    }

}
