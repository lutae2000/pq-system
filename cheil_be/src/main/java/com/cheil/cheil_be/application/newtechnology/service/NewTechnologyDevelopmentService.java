package com.cheil.cheil_be.application.newtechnology.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
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

import com.cheil.cheil_be.adapter.in.web.newtechnology.NewTechnologyDevelopmentRequest;
import com.cheil.cheil_be.adapter.in.web.newtechnology.NewTechnologyDevelopmentResponse;
import com.cheil.cheil_be.common.file.FileAttachmentService;
import com.cheil.cheil_be.common.security.AuditActorResolver;
import com.cheil.cheil_be.common.text.StringValues;

@Service
@RequiredArgsConstructor
public class NewTechnologyDevelopmentService {

    private static final int CODE_MAX_LENGTH = 100;
    private static final int TITLE_MAX_LENGTH = 500;
    private static final String ATTACHMENT_OWNER_TYPE = "NEW_TECHNOLOGY_DEVELOPMENT";
    private static final DateTimeFormatter COMPACT_DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;

    private final FileAttachmentService fileAttachmentService;
    private final JdbcClient jdbcClient;

    @Transactional(readOnly = true)
    public Page<NewTechnologyDevelopmentResponse> findAll(
            String keyword,
            String technologyType,
            String targetField,
            String applicationDateFrom,
            String applicationDateTo,
            Boolean useYn,
            String scoreReferenceDate,
            Pageable pageable
    ) {
        LocalDate referenceDate = resolveScoreReferenceDate(scoreReferenceDate);
        QueryParts queryParts = buildWhere(keyword, technologyType, targetField, applicationDateFrom, applicationDateTo, useYn);
        String listSql = """
                SELECT id, sequence_label, title, technology_type, applicant_count, use_yn, application_date,
                       target_field, application_no, registration_no, valid_until, calculated_score,
                       summary, remark, created_at, created_id, last_changed_at, last_changed_id
                FROM new_technology_developments
                """ + queryParts.whereSql() + """
                order by case technology_type when '신기술' then 1 
                                              when '특허' then 2
                                                end
                , application_date
                """;

        Map<String, Object> listParams = new LinkedHashMap<>(queryParts.params());
        listParams.put("limit", pageable.getPageSize());
        listParams.put("offset", pageable.getOffset());

        List<NewTechnologyDevelopmentResponse> content = bindParams(jdbcClient.sql(listSql), listParams)
                .query((rs, rowNum) -> mapDevelopmentResponse(rs, referenceDate))
                .list();

        Long total = bindParams(
                jdbcClient.sql("SELECT COUNT(*) FROM new_technology_developments " + queryParts.whereSql()),
                queryParts.params()
        )
                .query(Long.class)
                .single();
        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }

    @Transactional(readOnly = true)
    public NewTechnologyDevelopmentResponse findById(Long id) {
        return findById(id, null);
    }

    @Transactional(readOnly = true)
    public NewTechnologyDevelopmentResponse findById(Long id, String scoreReferenceDate) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "id는 필수입니다.");
        }
        LocalDate referenceDate = resolveScoreReferenceDate(scoreReferenceDate);
        return jdbcClient.sql("""
                        SELECT id, sequence_label, title, technology_type, applicant_count, use_yn, application_date,
                               target_field, application_no, registration_no, valid_until, calculated_score,
                               summary, remark, created_at, created_id, last_changed_at, last_changed_id
                        FROM new_technology_developments
                        WHERE id = :id
                        """)
                .param("id", id)
                .query((rs, rowNum) -> mapDevelopmentResponse(rs, referenceDate))
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "신기술 개발실적을 찾을 수 없습니다."));
    }

    @Transactional
    public NewTechnologyDevelopmentResponse create(NewTechnologyDevelopmentRequest request) {
        validate(request);
        String actor = AuditActorResolver.resolve();
        Long id = jdbcClient.sql("""
                        INSERT INTO new_technology_developments (
                            sequence_label, title, technology_type, applicant_count, use_yn, application_date,
                            target_field, application_no, registration_no, valid_until, calculated_score,
                            summary, remark, created_id, last_changed_id
                        )
                        VALUES (
                            :sequenceLabel, :title, :technologyType, :applicantCount, :useYn, :applicationDate,
                            :targetField, :applicationNo, :registrationNo, :validUntil, :calculatedScore,
                            :summary, :remark, :actor, :actor
                        )
                        RETURNING id
                        """)
                .param("sequenceLabel", nullIfBlank(request.sequenceLabel()))
                .param("title", StringValues.required(request.title(), "title"))
                .param("technologyType", nullIfBlank(request.technologyType()))
                .param("applicantCount", request.applicantCount())
                .param("useYn", request.useYn() == null || request.useYn())
                .param("applicationDate", normalizeDate(request.applicationDate(), "applicationDate", false))
                .param("targetField", nullIfBlank(request.targetField()))
                .param("applicationNo", nullIfBlank(request.applicationNo()))
                .param("registrationNo", nullIfBlank(request.registrationNo()))
                .param("validUntil", normalizeDate(request.validUntil(), "validUntil", false))
                .param("calculatedScore", request.calculatedScore())
                .param("summary", nullIfBlank(request.summary()))
                .param("remark", nullIfBlank(request.remark()))
                .param("actor", actor)
                .query(Long.class)
                .single();
        return findById(id);
    }

    @Transactional
    public NewTechnologyDevelopmentResponse update(Long id, NewTechnologyDevelopmentRequest request) {
        findById(id);
        validate(request);
        String actor = AuditActorResolver.resolve();
        jdbcClient.sql("""
                        UPDATE new_technology_developments
                        SET sequence_label = :sequenceLabel,
                            title = :title,
                            technology_type = :technologyType,
                            applicant_count = :applicantCount,
                            use_yn = :useYn,
                            application_date = :applicationDate,
                            target_field = :targetField,
                            application_no = :applicationNo,
                            registration_no = :registrationNo,
                            valid_until = :validUntil,
                            calculated_score = :calculatedScore,
                            summary = :summary,
                            remark = :remark,
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = :actor
                        WHERE id = :id
                        """)
                .param("id", id)
                .param("sequenceLabel", nullIfBlank(request.sequenceLabel()))
                .param("title", StringValues.required(request.title(), "title"))
                .param("technologyType", nullIfBlank(request.technologyType()))
                .param("applicantCount", request.applicantCount())
                .param("useYn", request.useYn() == null || request.useYn())
                .param("applicationDate", normalizeDate(request.applicationDate(), "applicationDate", false))
                .param("targetField", nullIfBlank(request.targetField()))
                .param("applicationNo", nullIfBlank(request.applicationNo()))
                .param("registrationNo", nullIfBlank(request.registrationNo()))
                .param("validUntil", normalizeDate(request.validUntil(), "validUntil", false))
                .param("calculatedScore", request.calculatedScore())
                .param("summary", nullIfBlank(request.summary()))
                .param("remark", nullIfBlank(request.remark()))
                .param("actor", actor)
                .update();
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        findById(id);
        fileAttachmentService.deleteAll(ATTACHMENT_OWNER_TYPE, String.valueOf(id));
        int deleted = jdbcClient.sql("DELETE FROM new_technology_developments WHERE id = :id")
                .param("id", id)
                .update();
        if (deleted != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "신기술 개발실적을 찾을 수 없습니다.");
        }
    }

    private QueryParts buildWhere(
            String keyword,
            String technologyType,
            String targetField,
            String applicationDateFrom,
            String applicationDateTo,
            Boolean useYn
    ) {
        StringBuilder where = new StringBuilder("WHERE 1 = 1\n");
        Map<String, Object> params = new LinkedHashMap<>();
        boolean effectiveUseYn = useYn == null || useYn;

        if (StringUtils.hasText(keyword)) {
            where.append("""
                    AND (
                        LOWER(title) LIKE :keyword
                        OR LOWER(COALESCE(application_no, '')) LIKE :keyword
                        OR LOWER(COALESCE(registration_no, '')) LIKE :keyword
                        OR LOWER(COALESCE(summary, '')) LIKE :keyword
                        OR LOWER(COALESCE(remark, '')) LIKE :keyword
                    )
                    """);
            params.put("keyword", "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%");
        }
        if (StringUtils.hasText(technologyType)) {
            where.append("AND technology_type = :technologyType\n");
            params.put("technologyType", technologyType.trim());
        }
        if (StringUtils.hasText(targetField)) {
            where.append("AND LOWER(COALESCE(target_field, '')) LIKE :targetField\n");
            params.put("targetField", "%" + targetField.trim().toLowerCase(Locale.ROOT) + "%");
        }
        String normalizedApplicationDateFrom = normalizeDate(applicationDateFrom, "applicationDateFrom", false);
        if (StringUtils.hasText(normalizedApplicationDateFrom)) {
            where.append("AND application_date >= :applicationDateFrom\n");
            params.put("applicationDateFrom", normalizedApplicationDateFrom);
        }
        String normalizedApplicationDateTo = normalizeDate(applicationDateTo, "applicationDateTo", false);
        if (StringUtils.hasText(normalizedApplicationDateTo)) {
            where.append("AND application_date <= :applicationDateTo\n");
            params.put("applicationDateTo", normalizedApplicationDateTo);
        }
        where.append("AND use_yn = :useYn\n");
        params.put("useYn", effectiveUseYn);

        return new QueryParts(where.toString(), params);
    }

    private NewTechnologyDevelopmentResponse mapDevelopmentResponse(ResultSet rs, LocalDate referenceDate) throws SQLException {
        String applicationDate = rs.getString("application_date");
        BigDecimal applicantCount = rs.getBigDecimal("applicant_count");
        BigDecimal elapsedYears = calculateElapsedYears(applicationDate, referenceDate);
        return new NewTechnologyDevelopmentResponse(
                rs.getLong("id"),
                rs.getString("sequence_label"),
                rs.getString("title"),
                rs.getString("technology_type"),
                applicantCount,
                rs.getBoolean("use_yn"),
                applicationDate,
                elapsedYears,
                resolveCalculatedScore(rs.getBigDecimal("calculated_score"), rs.getString("technology_type"), applicantCount, elapsedYears),
                rs.getString("target_field"),
                rs.getString("application_no"),
                rs.getString("registration_no"),
                rs.getString("valid_until"),
                rs.getString("summary"),
                rs.getString("remark"),
                toInstant(rs.getTimestamp("created_at")),
                rs.getString("created_id"),
                toInstant(rs.getTimestamp("last_changed_at")),
                rs.getString("last_changed_id")
        );
    }

    private BigDecimal calculateElapsedYears(String applicationDate, LocalDate referenceDate) {
        if (!StringUtils.hasText(applicationDate)) {
            return null;
        }
        LocalDate parsedApplicationDate = parseCompactDate(applicationDate);
        long days = ChronoUnit.DAYS.between(parsedApplicationDate, referenceDate);
        if (days < 0) {
            return BigDecimal.ZERO.setScale(2);
        }
        return BigDecimal.valueOf(days)
                .divide(BigDecimal.valueOf(365), 4, RoundingMode.HALF_UP)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateScore(String technologyType, BigDecimal applicantCount, BigDecimal elapsedYears) {
        if (applicantCount == null || applicantCount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(2);
        }
        if ("신기술".equals(StringValues.normalize(technologyType))) {
            return BigDecimal.valueOf(2)
                    .setScale(2, RoundingMode.DOWN)
                    .divide(applicantCount, 10, RoundingMode.HALF_UP);
        }
        BigDecimal baseScore = baseScore(technologyType, elapsedYears);
        return baseScore
                .divide(applicantCount, 10, RoundingMode.DOWN)
                .setScale(2, RoundingMode.DOWN);
    }

    private BigDecimal baseScore(String technologyType, BigDecimal elapsedYears) {
        String normalizedType = StringValues.normalize(technologyType);
        double years = elapsedYears == null ? 0 : elapsedYears.doubleValue();
        if ("신기술".equals(normalizedType)) {
            return BigDecimal.valueOf(2);
        }
        if ("특허".equals(normalizedType)) {
            if (years < 5) {
                return BigDecimal.valueOf(1);
            }
            return years < 10 ? BigDecimal.valueOf(0.8) : BigDecimal.valueOf(0.6);
        }
        if ("신안".equals(normalizedType)) {
            if (years < 5) {
                return BigDecimal.valueOf(0.5);
            }
            return years < 10 ? BigDecimal.valueOf(0.4) : BigDecimal.ZERO;
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal resolveCalculatedScore(
            BigDecimal calculatedScore,
            String technologyType,
            BigDecimal applicantCount,
            BigDecimal elapsedYears
    ) {
        return calculatedScore != null ? calculatedScore : calculateScore(technologyType, applicantCount, elapsedYears);
    }
    private void validate(NewTechnologyDevelopmentRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "요청 본문은 필수입니다.");
        }

        StringValues.validateMaxLength(StringValues.normalize(request.sequenceLabel()), CODE_MAX_LENGTH, "sequenceLabel");
        StringValues.validateMaxLength(StringValues.required(request.title(), "title"), TITLE_MAX_LENGTH, "title");
        StringValues.validateMaxLength(StringValues.normalize(request.technologyType()), CODE_MAX_LENGTH, "technologyType");
        StringValues.validateMaxLength(StringValues.normalize(request.targetField()), CODE_MAX_LENGTH, "targetField");
        StringValues.validateMaxLength(StringValues.normalize(request.applicationNo()), CODE_MAX_LENGTH, "applicationNo");
        StringValues.validateMaxLength(StringValues.normalize(request.registrationNo()), CODE_MAX_LENGTH, "registrationNo");
        normalizeDate(request.applicationDate(), "applicationDate", false);
        normalizeDate(request.validUntil(), "validUntil", false);
        if (request.applicantCount() != null && request.applicantCount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "applicantCount??0蹂대떎 而ㅼ빞 ?⑸땲??");
        }
        if (request.calculatedScore() != null && request.calculatedScore().compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "calculatedScore??0蹂대떎 而ㅼ빞 ?⑸땲??");
        }
    }

    private LocalDate resolveScoreReferenceDate(String value) {
        String normalized = normalizeDate(value, "scoreReferenceDate", false);
        return StringUtils.hasText(normalized) ? parseCompactDate(normalized) : LocalDate.now();
    }

    private String normalizeDate(String value, String fieldName, boolean required) {
        String normalized = StringValues.normalize(value);
        if (!StringUtils.hasText(normalized)) {
            if (required) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + "\uB294 \uD544\uC218\uC785\uB2C8\uB2E4.");
            }
            return null;
        }
        String compact = normalized.replace("-", "");
        if (!compact.matches("\\d{8}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + "\uB294 YYYYMMDD \uD615\uC2DD\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.");
        }
        try {
            parseCompactDate(compact);
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + "\uB294 YYYYMMDD \uD615\uC2DD\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.");
        }
        return compact;
    }

    private LocalDate parseCompactDate(String value) {
        return LocalDate.parse(value.replace("-", ""), COMPACT_DATE_FORMATTER);
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
