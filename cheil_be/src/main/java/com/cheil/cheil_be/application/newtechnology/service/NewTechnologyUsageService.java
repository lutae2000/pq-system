package com.cheil.cheil_be.application.newtechnology.service;

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

import com.cheil.cheil_be.adapter.in.web.newtechnology.NewTechnologyUsageRequest;
import com.cheil.cheil_be.adapter.in.web.newtechnology.NewTechnologyUsageResponse;
import com.cheil.cheil_be.common.file.FileAttachmentService;
import com.cheil.cheil_be.common.security.AuditActorResolver;
import com.cheil.cheil_be.common.text.StringValues;

/** 신기술 사용실적 목록과 상세 정보를 조회하고 관리하는 서비스. */
@Service
@RequiredArgsConstructor
public class NewTechnologyUsageService {

    private static final int CODE_MAX_LENGTH = 100;
    private static final int TITLE_MAX_LENGTH = 500;
    private static final String ATTACHMENT_OWNER_TYPE = "NEW_TECHNOLOGY_USAGE";
    private static final DateTimeFormatter COMPACT_DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;

    private final FileAttachmentService fileAttachmentService;
    private final JdbcClient jdbcClient;

    @Transactional(readOnly = true)
    public Page<NewTechnologyUsageResponse> findAll(
            String keyword,
            String designationNo,
            String client,
            String noticeDateFrom,
            String noticeDateTo,
            Pageable pageable
    ) {
        QueryParts queryParts = buildWhere(keyword, designationNo, client, noticeDateFrom, noticeDateTo);
        String listSql = """
                SELECT id, designation_no, title, developers, project_name, client,
                       notice_date, usage_expiration_date,
                       usage_count, amount_thousand, score,
                       summary, weight, disaster_prevention_score, remark,
                       created_at, created_id, last_changed_at, last_changed_id
                FROM new_technology_usages
                """ + queryParts.whereSql() + """
                ORDER BY notice_date DESC NULLS LAST, designation_no, id DESC
                LIMIT :limit OFFSET :offset
                """;

        Map<String, Object> listParams = new LinkedHashMap<>(queryParts.params());
        listParams.put("limit", pageable.getPageSize());
        listParams.put("offset", pageable.getOffset());

        List<NewTechnologyUsageResponse> content = bindParams(jdbcClient.sql(listSql), listParams)
                .query((rs, rowNum) -> mapUsageResponse(rs))
                .list();

        Long total = bindParams(
                jdbcClient.sql("SELECT COUNT(*) FROM new_technology_usages " + queryParts.whereSql()),
                queryParts.params()
        )
                .query(Long.class)
                .single();
        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }

    @Transactional(readOnly = true)
    public NewTechnologyUsageResponse findById(Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "id is required.");
        }
        return jdbcClient.sql("""
                        SELECT id, designation_no, title, developers, project_name, client,
                               notice_date, usage_expiration_date,
                               usage_count, amount_thousand, score,
                               summary, weight, disaster_prevention_score, remark,
                               created_at, created_id, last_changed_at, last_changed_id
                        FROM new_technology_usages
                        WHERE id = :id
                        """)
                .param("id", id)
                .query((rs, rowNum) -> mapUsageResponse(rs))
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "신기술 활용실적을 찾을 수 없습니다."));
    }

    @Transactional
    public NewTechnologyUsageResponse create(NewTechnologyUsageRequest request) {
        validate(request);
        String actor = AuditActorResolver.resolve();
        Long id = jdbcClient.sql("""
                        INSERT INTO new_technology_usages (
                            designation_no, title, developers, project_name, client,
                            notice_date, usage_expiration_date,
                            usage_count, amount_thousand, score,
                            summary, weight, disaster_prevention_score, remark, created_id, last_changed_id
                        )
                        VALUES (
                            :designationNo, :title, :developers, :projectName, :client,
                            :noticeDate, :usageExpirationDate,
                            :usageCount, :amountThousand, :score,
                            :summary, :weight, :disasterPreventionScore, :remark, :actor, :actor
                        )
                        RETURNING id
                        """)
                .param("designationNo", StringValues.required(request.designationNo(), "designationNo"))
                .param("title", StringValues.required(request.title(), "title"))
                .param("developers", nullIfBlank(request.developers()))
                .param("projectName", nullIfBlank(request.projectName()))
                .param("client", nullIfBlank(request.client()))
                .param("noticeDate", normalizeDate(request.noticeDate(), "noticeDate", false))
                .param("usageExpirationDate", normalizeDate(request.usageExpirationDate(), "usageExpirationDate", false))
                .param("usageCount", request.usageCount())
                .param("amountThousand", request.amountThousand())
                .param("score", request.score())
                .param("summary", nullIfBlank(request.summary()))
                .param("weight", request.weight())
                .param("disasterPreventionScore", request.disasterPreventionScore())
                .param("remark", nullIfBlank(request.remark()))
                .param("actor", actor)
                .query(Long.class)
                .single();
        return findById(id);
    }

    @Transactional
    public NewTechnologyUsageResponse update(Long id, NewTechnologyUsageRequest request) {
        findById(id);
        validate(request);
        String actor = AuditActorResolver.resolve();
        jdbcClient.sql("""
                        UPDATE new_technology_usages
                        SET designation_no = :designationNo,
                            title = :title,
                            developers = :developers,
                            project_name = :projectName,
                            client = :client,
                            notice_date = :noticeDate,
                            usage_expiration_date = :usageExpirationDate,
                            usage_count = :usageCount,
                            amount_thousand = :amountThousand,
                            score = :score,
                            summary = :summary,
                            weight = :weight,
                            disaster_prevention_score = :disasterPreventionScore,
                            remark = :remark,
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = :actor
                        WHERE id = :id
                        """)
                .param("id", id)
                .param("designationNo", StringValues.required(request.designationNo(), "designationNo"))
                .param("title", StringValues.required(request.title(), "title"))
                .param("developers", nullIfBlank(request.developers()))
                .param("projectName", nullIfBlank(request.projectName()))
                .param("client", nullIfBlank(request.client()))
                .param("noticeDate", normalizeDate(request.noticeDate(), "noticeDate", false))
                .param("usageExpirationDate", normalizeDate(request.usageExpirationDate(), "usageExpirationDate", false))
                .param("usageCount", request.usageCount())
                .param("amountThousand", request.amountThousand())
                .param("score", request.score())
                .param("summary", nullIfBlank(request.summary()))
                .param("weight", request.weight())
                .param("disasterPreventionScore", request.disasterPreventionScore())
                .param("remark", nullIfBlank(request.remark()))
                .param("actor", actor)
                .update();
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        findById(id);
        fileAttachmentService.deleteAll(ATTACHMENT_OWNER_TYPE, String.valueOf(id));
        int deleted = jdbcClient.sql("DELETE FROM new_technology_usages WHERE id = :id")
                .param("id", id)
                .update();
        if (deleted != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "신기술 활용실적을 찾을 수 없습니다.");
        }
    }

    private QueryParts buildWhere(
            String keyword,
            String designationNo,
            String client,
            String noticeDateFrom,
            String noticeDateTo
    ) {
        StringBuilder where = new StringBuilder("WHERE 1 = 1\n");
        Map<String, Object> params = new LinkedHashMap<>();

        if (StringUtils.hasText(keyword)) {
            where.append("""
                    AND (
                        LOWER(title) LIKE :keyword
                        OR LOWER(COALESCE(developers, '')) LIKE :keyword
                        OR LOWER(COALESCE(project_name, '')) LIKE :keyword
                        OR LOWER(COALESCE(client, '')) LIKE :keyword
                        OR LOWER(COALESCE(summary, '')) LIKE :keyword
                        OR LOWER(COALESCE(remark, '')) LIKE :keyword
                    )
                    """);
            params.put("keyword", "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%");
        }
        if (StringUtils.hasText(designationNo)) {
            where.append("AND LOWER(designation_no) LIKE :designationNo\n");
            params.put("designationNo", "%" + designationNo.trim().toLowerCase(Locale.ROOT) + "%");
        }
        if (StringUtils.hasText(client)) {
            where.append("AND LOWER(COALESCE(client, '')) LIKE :client\n");
            params.put("client", "%" + client.trim().toLowerCase(Locale.ROOT) + "%");
        }
        String normalizedNoticeDateFrom = normalizeDate(noticeDateFrom, "noticeDateFrom", false);
        if (StringUtils.hasText(normalizedNoticeDateFrom)) {
            where.append("AND notice_date >= :noticeDateFrom\n");
            params.put("noticeDateFrom", normalizedNoticeDateFrom);
        }
        String normalizedNoticeDateTo = normalizeDate(noticeDateTo, "noticeDateTo", false);
        if (StringUtils.hasText(normalizedNoticeDateTo)) {
            where.append("AND notice_date <= :noticeDateTo\n");
            params.put("noticeDateTo", normalizedNoticeDateTo);
        }

        return new QueryParts(where.toString(), params);
    }

    private NewTechnologyUsageResponse mapUsageResponse(ResultSet rs) throws SQLException {
        return new NewTechnologyUsageResponse(
                rs.getLong("id"),
                rs.getString("designation_no"),
                rs.getString("title"),
                rs.getString("developers"),
                rs.getString("project_name"),
                rs.getString("client"),
                rs.getString("notice_date"),
                rs.getString("usage_expiration_date"),
                getNullableInteger(rs, "usage_count"),
                rs.getBigDecimal("amount_thousand"),
                rs.getBigDecimal("score"),
                rs.getString("summary"),
                rs.getBigDecimal("weight"),
                rs.getBigDecimal("disaster_prevention_score"),
                rs.getString("remark"),
                toInstant(rs.getTimestamp("created_at")),
                rs.getString("created_id"),
                toInstant(rs.getTimestamp("last_changed_at")),
                rs.getString("last_changed_id")
        );
    }

    private void validate(NewTechnologyUsageRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }

        StringValues.validateMaxLength(StringValues.required(request.designationNo(), "designationNo"), CODE_MAX_LENGTH, "designationNo");
        StringValues.validateMaxLength(StringValues.required(request.title(), "title"), TITLE_MAX_LENGTH, "title");
        StringValues.validateMaxLength(StringValues.normalize(request.client()), 300, "client");
        normalizeDate(request.noticeDate(), "noticeDate", false);
        normalizeDate(request.usageExpirationDate(), "usageExpirationDate", false);
        validateNonNegative(request.usageCount(), "usageCount");
        validateNonNegative(request.amountThousand(), "amountThousand");
        validateNonNegative(request.score(), "score");
        validateNonNegative(request.weight(), "weight");
        validateNonNegative(request.disasterPreventionScore(), "disasterPreventionScore");
    }

    private void validateNonNegative(Integer value, String fieldName) {
        if (value != null && value < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be greater than or equal to 0.");
        }
    }

    private void validateNonNegative(BigDecimal value, String fieldName) {
        if (value != null && value.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be greater than or equal to 0.");
        }
    }

    private Integer getNullableInteger(ResultSet rs, String columnName) throws SQLException {
        int value = rs.getInt(columnName);
        return rs.wasNull() ? null : value;
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
