package com.cheil.cheil_be.application.shinindo.service;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
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

import com.cheil.cheil_be.adapter.in.web.shinindo.ShinindoManagementRequest;
import com.cheil.cheil_be.adapter.in.web.shinindo.ShinindoManagementResponse;
import com.cheil.cheil_be.common.security.AuditActorResolver;
import com.cheil.cheil_be.common.text.StringValues;

/** 신인도 평가 자료를 조회하고 등록·수정·삭제하는 서비스. */
@Service
@RequiredArgsConstructor
public class ShinindoManagementService {

    private static final int CLIENT_CODE_MAX_LENGTH = 20;
    private static final int ITEM_NAME_MAX_LENGTH = 300;
    private static final int REMARK_MAX_LENGTH = 1000;
    private static final DateTimeFormatter COMPACT_DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;

    private final JdbcClient jdbcClient;

    @Transactional(readOnly = true)
    public Page<ShinindoManagementResponse> findAll(
            String keyword,
            String clientCode,
            String referenceDate,
            Pageable pageable
    ) {
        QueryParts queryParts = buildWhere(keyword, clientCode);
        String listSql = """
                SELECT m.id,
                       m.client_code,
                       COALESCE(c.order_name_long, c.order_name, m.client_code) AS client_name,
                       m.item_name,
                       m.applied_yn,
                       m.score,
                       m.acquired_date,
                       m.valid_until,
                       m.remark,
                       m.created_at,
                       m.created_id,
                       m.last_changed_at,
                       m.last_changed_id
                FROM shinindo_managements m
                LEFT JOIN clients c ON c.client_code = m.client_code
                """ + queryParts.whereSql() + """
                ORDER BY m.client_code, m.item_name, m.id DESC
                LIMIT :limit OFFSET :offset
                """;

        Map<String, Object> listParams = new LinkedHashMap<>(queryParts.params());
        listParams.put("limit", pageable.getPageSize());
        listParams.put("offset", pageable.getOffset());

        List<ShinindoManagementResponse> content = bindParams(jdbcClient.sql(listSql), listParams)
                .query((rs, rowNum) -> mapResponse(rs))
                .list();

        Long total = bindParams(
                jdbcClient.sql("""
                        SELECT COUNT(*)
                        FROM shinindo_managements m
                        LEFT JOIN clients c ON c.client_code = m.client_code
                        """ + queryParts.whereSql()),
                queryParts.params()
        )
                .query(Long.class)
                .single();
        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }

    @Transactional(readOnly = true)
    public ShinindoManagementResponse findById(Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "id is required.");
        }
        return jdbcClient.sql("""
                        SELECT m.id,
                               m.client_code,
                               COALESCE(c.order_name_long, c.order_name, m.client_code) AS client_name,
                               m.item_name,
                               m.applied_yn,
                               m.score,
                               m.acquired_date,
                               m.valid_until,
                               m.remark,
                               m.created_at,
                               m.created_id,
                               m.last_changed_at,
                               m.last_changed_id
                        FROM shinindo_managements m
                        LEFT JOIN clients c ON c.client_code = m.client_code
                        WHERE m.id = :id
                        """)
                .param("id", id)
                .query((rs, rowNum) -> mapResponse(rs))
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "신인도 정보를 찾을 수 없습니다."));
    }

    @Transactional
    public ShinindoManagementResponse create(ShinindoManagementRequest request) {
        validate(request);
        String actor = AuditActorResolver.resolve();
        ensureClientExists(request.clientCode());
        Long id = jdbcClient.sql("""
                        INSERT INTO shinindo_managements (
                            client_code, item_name, applied_yn, score, acquired_date, valid_until, remark, created_id, last_changed_id
                        )
                        VALUES (
                            :clientCode, :itemName, :appliedYn, :score, :acquiredDate, :validUntil, :remark, :actor, :actor
                        )
                        RETURNING id
                        """)
                .param("clientCode", StringValues.required(request.clientCode(), "clientCode"))
                .param("itemName", StringValues.required(request.itemName(), "itemName"))
                .param("appliedYn", normalizeAppliedYn(request.appliedYn()))
                .param("score", normalizeScore(request.score()))
                .param("acquiredDate", normalizeDate(request.acquiredDate(), "acquiredDate", false))
                .param("validUntil", normalizeDate(request.validUntil(), "validUntil", false))
                .param("remark", nullIfBlank(request.remark()))
                .param("actor", actor)
                .query(Long.class)
                .single();
        return findById(id);
    }

    @Transactional
    public ShinindoManagementResponse update(Long id, ShinindoManagementRequest request) {
        findById(id);
        validate(request);
        String actor = AuditActorResolver.resolve();
        ensureClientExists(request.clientCode());
        jdbcClient.sql("""
                        UPDATE shinindo_managements
                        SET client_code = :clientCode,
                            item_name = :itemName,
                            applied_yn = :appliedYn,
                            score = :score,
                            acquired_date = :acquiredDate,
                            valid_until = :validUntil,
                            remark = :remark,
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = :actor
                        WHERE id = :id
                        """)
                .param("id", id)
                .param("clientCode", StringValues.required(request.clientCode(), "clientCode"))
                .param("itemName", StringValues.required(request.itemName(), "itemName"))
                .param("appliedYn", normalizeAppliedYn(request.appliedYn()))
                .param("score", normalizeScore(request.score()))
                .param("acquiredDate", normalizeDate(request.acquiredDate(), "acquiredDate", false))
                .param("validUntil", normalizeDate(request.validUntil(), "validUntil", false))
                .param("remark", nullIfBlank(request.remark()))
                .param("actor", actor)
                .update();
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        findById(id);
        int deleted = jdbcClient.sql("DELETE FROM shinindo_managements WHERE id = :id")
                .param("id", id)
                .update();
        if (deleted != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "신인도 정보를 찾을 수 없습니다.");
        }
    }

    private QueryParts buildWhere(String keyword, String clientCode) {
        StringBuilder where = new StringBuilder("WHERE 1 = 1\n");
        Map<String, Object> params = new LinkedHashMap<>();

        if (StringUtils.hasText(keyword)) {
            where.append("""
                    AND (
                        LOWER(m.item_name) LIKE :keyword
                        OR LOWER(COALESCE(m.remark, '')) LIKE :keyword
                        OR LOWER(COALESCE(c.order_name_long, c.order_name, m.client_code)) LIKE :keyword
                    )
                    """);
            params.put("keyword", "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%");
        }
        if (StringUtils.hasText(clientCode)) {
            where.append("AND LOWER(m.client_code) LIKE :clientCode\n");
            params.put("clientCode", "%" + clientCode.trim().toLowerCase(Locale.ROOT) + "%");
        }

        return new QueryParts(where.toString(), params);
    }

    private ShinindoManagementResponse mapResponse(ResultSet rs) throws SQLException {
        return new ShinindoManagementResponse(
                rs.getLong("id"),
                rs.getString("client_code"),
                rs.getString("client_name"),
                rs.getString("item_name"),
                rs.getString("applied_yn"),
                rs.getBigDecimal("score"),
                rs.getString("acquired_date"),
                rs.getString("valid_until"),
                rs.getString("remark"),
                toInstant(rs.getTimestamp("created_at")),
                rs.getString("created_id"),
                toInstant(rs.getTimestamp("last_changed_at")),
                rs.getString("last_changed_id")
        );
    }

    private void validate(ShinindoManagementRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }

        StringValues.validateMaxLength(StringValues.required(request.clientCode(), "clientCode"), CLIENT_CODE_MAX_LENGTH, "clientCode");
        StringValues.validateMaxLength(StringValues.required(request.itemName(), "itemName"), ITEM_NAME_MAX_LENGTH, "itemName");
        StringValues.validateMaxLength(StringValues.normalize(request.remark()), REMARK_MAX_LENGTH, "remark");
        normalizeAppliedYn(request.appliedYn());
        normalizeScore(request.score());
        normalizeDate(request.acquiredDate(), "acquiredDate", false);
        normalizeDate(request.validUntil(), "validUntil", false);
    }

    private void ensureClientExists(String clientCode) {
        Boolean exists = jdbcClient.sql("SELECT EXISTS (SELECT 1 FROM clients WHERE client_code = :clientCode)")
                .param("clientCode", StringValues.required(clientCode, "clientCode"))
                .query(Boolean.class)
                .single();
        if (!Boolean.TRUE.equals(exists)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 발주청 코드입니다.");
        }
    }

    private String normalizeAppliedYn(String value) {
        String normalized = StringValues.required(value, "appliedYn").trim().toUpperCase(Locale.ROOT);
        if (!"Y".equals(normalized) && !"N".equals(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "appliedYn must be Y or N.");
        }
        return normalized;
    }

    private BigDecimal normalizeScore(BigDecimal value) {
        if (value == null) {
            return null;
        }
        if (value.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "score must be greater than or equal to 0.");
        }
        return value;
    }

    private String normalizeDate(String value, String fieldName, boolean required) {
        String normalized = StringValues.normalize(value);
        if (!StringUtils.hasText(normalized)) {
            if (required) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required.");
            }
            return null;
        }
        String compact = normalized.replace("-", "");
        if (!compact.matches("\\d{8}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be YYYYMMDD.");
        }
        try {
            LocalDate.parse(compact, COMPACT_DATE_FORMATTER);
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be YYYYMMDD.");
        }
        return compact;
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
