package com.cheil.cheil_be.application.educationreminder.service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderCompletionRequest;
import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderCompletionResponse;
import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderHighlightTone;
import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderNotificationPhoneRequest;
import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderNotificationPhoneResponse;
import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderNotificationTargetResponse;
import com.cheil.cheil_be.common.security.AuditActorResolver;
import com.cheil.cheil_be.common.text.StringValues;

@Service
@RequiredArgsConstructor
public class EducationReminderCompletionService {

    private static final int CODE_MAX_LENGTH = 50;
    private static final int ENGINEER_ID_MAX_LENGTH = 20;
    private static final int PHONE_NO_MAX_LENGTH = 50;
    private static final int REMARK_MAX_LENGTH = 4000;

    private final JdbcClient jdbcClient;
    private final EducationReminderCompletionHighlightResolver highlightResolver;

    private record CompletionSearchCriteria(
            String name,
            Boolean educationRegistered,
            String retireYn,
            String specialtyField,
            String jobField,
            String recentEducationStartDate1,
            String recentEducationStartDate2
    ) {
    }

    private record QueryParts(
            String engineerBaseWhere,
            String outerWhere,
            Map<String, Object> params
    ) {
    }

    private static final class NotificationTargetAggregate {
        private final String engineerId;
        private final String name;
        private final String department;
        private final String grade;
        private final String jobField;
        private final String specialtyField;
        private final String hasProfessionalCert;
        private final String professionalCertNames;
        private final String phoneNo;
        private final Set<String> targetEducationNames = new TreeSet<>();
        private EducationReminderHighlightTone highlightTone = EducationReminderHighlightTone.NONE;

        private NotificationTargetAggregate(EducationReminderCompletionResponse row, String phoneNo) {
            this.engineerId = row.engineerId();
            this.name = row.name();
            this.department = row.department();
            this.grade = row.grade();
            this.jobField = row.jobField();
            this.specialtyField = row.specialtyField();
            this.hasProfessionalCert = row.hasProfessionalCert();
            this.professionalCertNames = row.professionalCertNames();
            this.phoneNo = phoneNo;
        }

        private void add(EducationReminderCompletionResponse row) {
            if (StringUtils.hasText(row.educationName())) {
                targetEducationNames.add(row.educationName().trim());
            }
            if (row.highlightTone() == EducationReminderHighlightTone.OVERDUE) {
                highlightTone = EducationReminderHighlightTone.OVERDUE;
            } else if (row.highlightTone() == EducationReminderHighlightTone.UPCOMING && highlightTone == EducationReminderHighlightTone.NONE) {
                highlightTone = EducationReminderHighlightTone.UPCOMING;
            }
        }

        private EducationReminderNotificationTargetResponse toResponse() {
            return new EducationReminderNotificationTargetResponse(
                    engineerId,
                    engineerId,
                    name,
                    department,
                    grade,
                    jobField,
                    specialtyField,
                    hasProfessionalCert,
                    professionalCertNames,
                    String.join(", ", targetEducationNames),
                    phoneNo,
                    highlightTone
            );
        }
    }

    @Transactional(readOnly = true)
    public List<EducationReminderCompletionResponse> findCompletions(
            String name,
            Boolean educationRegistered,
            String retireYn,
            String specialtyField,
            String jobField,
            String recentEducationStartDate1,
            String recentEducationStartDate2
    ) {
        CompletionSearchCriteria criteria = normalizeSearchCriteria(
                name,
                educationRegistered,
                retireYn,
                specialtyField,
                jobField,
                recentEducationStartDate1,
                recentEducationStartDate2
        );
        QueryParts queryParts = buildQueryParts(criteria);

        return jdbcClient.sql(buildFindCompletionsSql(queryParts))
                .params(queryParts.params())
                .query((rs, rowNum) -> mapCompletion(rs))
                .list();
    }

    @Transactional(readOnly = true)
    public List<EducationReminderNotificationTargetResponse> findNotificationTargets(
            String name,
            String specialtyField,
            String jobField
    ) {
        List<EducationReminderCompletionResponse> completions = findCompletions(
                name,
                Boolean.FALSE,
                "N",
                specialtyField,
                jobField,
                null,
                null
        );
        if (completions.isEmpty()) {
            return List.of();
        }

        Map<String, String> phoneNumbersByEngineerId = findPhoneNumbersByEngineerIds(
                completions.stream()
                        .map(EducationReminderCompletionResponse::engineerId)
                        .collect(java.util.stream.Collectors.toCollection(java.util.LinkedHashSet::new))
        );

        Map<String, NotificationTargetAggregate> aggregates = new LinkedHashMap<>();
        for (EducationReminderCompletionResponse row : completions) {
            if (!isNotificationTarget(row)) {
                continue;
            }

            NotificationTargetAggregate aggregate = aggregates.computeIfAbsent(
                    row.engineerId(),
                    engineerId -> new NotificationTargetAggregate(row, phoneNumbersByEngineerId.getOrDefault(engineerId, ""))
            );
            aggregate.add(row);
        }

        return aggregates.values().stream()
                .map(NotificationTargetAggregate::toResponse)
                .sorted(Comparator.comparing(EducationReminderNotificationTargetResponse::name)
                        .thenComparing(EducationReminderNotificationTargetResponse::engineerId))
                .toList();
    }

    private String buildFindCompletionsSql(QueryParts queryParts) {
        return """
                WITH engineer_base AS (
                    SELECT
                        m.engr_id,
                        m.namekor,
                        m.deptname,
                        m.grade,
                        COALESCE(m.retireyn, 'N') AS retireyn,
                        m.dutypart,
                        m.propart
                    FROM pq_engineer_master m
                    %s
                ),
                professional_engineers AS (
                    SELECT
                        l.engr_id,
                        STRING_AGG(DISTINCT c.cert_name, ', ' ORDER BY c.cert_name) AS professional_cert_names
                    FROM pq_engineer_license l
                    JOIN certifications c ON c.cert_code = l.license_code
                    WHERE c.cert_kind = 4
                    GROUP BY l.engr_id
                ),
                required_educations AS (
                    SELECT
                        b.code AS education_code,
                        b.name AS education_name,
                        b.cycle_unit,
                        b.cycle_value,
                        FALSE AS professional_only
                    FROM education_reminder_basic_infos b
                    WHERE b.active = TRUE
                    UNION ALL
                    SELECT
                        'PE-EXTRA' AS education_code,
                        '기술사 추가 교육' AS education_name,
                        'YEAR' AS cycle_unit,
                        5 AS cycle_value,
                        TRUE AS professional_only
                ),
                target_matrix AS (
                    SELECT
                        e.engr_id,
                        e.namekor,
                        e.deptname,
                        e.grade,
                        e.retireyn,
                        e.dutypart,
                        e.propart,
                        r.education_code,
                        r.education_name,
                        r.cycle_unit,
                        r.cycle_value,
                        CASE WHEN p.engr_id IS NOT NULL THEN 'Y' ELSE 'N' END AS has_professional_cert,
                        COALESCE(p.professional_cert_names, '') AS professional_cert_names
                    FROM engineer_base e
                    LEFT JOIN professional_engineers p ON p.engr_id = e.engr_id
                    JOIN required_educations r
                      ON r.professional_only = FALSE
                      OR p.engr_id IS NOT NULL
                ),
                latest_completion AS (
                    SELECT *
                    FROM (
                        SELECT
                            em.engr_id,
                            em.education_code,
                            em.education_start_date_1,
                            em.education_start_date_2,
                            COALESCE(em.education_registered, FALSE) AS education_registered,
                            em.remark,
                            em.created_at,
                            em.created_id,
                            em.last_changed_at,
                            em.last_changed_id,
                            ROW_NUMBER() OVER (
                                PARTITION BY em.engr_id, em.education_code
                                ORDER BY
                                    COALESCE(NULLIF(em.education_start_date_1, ''), '00000000') DESC,
                                    em.last_changed_at DESC NULLS LAST,
                                    em.created_at DESC NULLS LAST
                            ) AS rn
                        FROM education_management em
                    ) ranked
                    WHERE ranked.rn = 1
                )
                SELECT
                    t.engr_id,
                    t.namekor,
                    t.deptname,
                    t.grade,
                    t.retireyn,
                    t.dutypart,
                    t.propart,
                    t.has_professional_cert,
                    t.professional_cert_names,
                    t.education_code,
                    t.education_name,
                    t.cycle_unit,
                    t.cycle_value,
                    lc.education_start_date_1,
                    lc.education_start_date_2,
                    COALESCE(lc.education_registered, FALSE) AS education_registered,
                    lc.remark,
                    lc.created_at,
                    lc.created_id,
                    lc.last_changed_at,
                    lc.last_changed_id
                FROM target_matrix t
                LEFT JOIN latest_completion lc
                  ON lc.engr_id = t.engr_id
                 AND lc.education_code = t.education_code
                %s
                ORDER BY t.namekor, t.engr_id, t.education_name
                """.formatted(queryParts.engineerBaseWhere(), queryParts.outerWhere());
    }

    private CompletionSearchCriteria normalizeSearchCriteria(
            String name,
            Boolean educationRegistered,
            String retireYn,
            String specialtyField,
            String jobField,
            String recentEducationStartDate1,
            String recentEducationStartDate2
    ) {
        return new CompletionSearchCriteria(
                like(name),
                educationRegistered,
                nullIfBlank(retireYn),
                nullIfBlank(specialtyField),
                nullIfBlank(jobField),
                EducationReminderDateUtils.normalizeOptionalDateFilter(recentEducationStartDate1),
                EducationReminderDateUtils.normalizeOptionalDateFilter(recentEducationStartDate2)
        );
    }

    private QueryParts buildQueryParts(CompletionSearchCriteria criteria) {
        StringBuilder engineerBaseWhere = new StringBuilder("WHERE 1 = 1");
        StringBuilder outerWhere = new StringBuilder("WHERE 1 = 1");
        Map<String, Object> params = new LinkedHashMap<>();

        appendEngineerFilters(criteria, engineerBaseWhere, params);
        appendCompletionFilters(criteria, outerWhere, params);

        return new QueryParts(engineerBaseWhere.toString(), outerWhere.toString(), params);
    }

    private void appendEngineerFilters(
            CompletionSearchCriteria criteria,
            StringBuilder engineerBaseWhere,
            Map<String, Object> params
    ) {
        engineerBaseWhere.append("\n                      AND COALESCE(m.education_exception, FALSE) = FALSE");

        if (criteria.name() != null) {
            engineerBaseWhere.append("\n                      AND LOWER(m.namekor) LIKE :name");
            params.put("name", criteria.name());
        }
        if (criteria.retireYn() != null) {
            engineerBaseWhere.append("\n                      AND COALESCE(m.retireyn, 'N') = :retireYn");
            params.put("retireYn", criteria.retireYn());
        }
        if (criteria.specialtyField() != null) {
            engineerBaseWhere.append("\n                      AND m.propart = :specialtyField");
            params.put("specialtyField", criteria.specialtyField());
        }
        if (criteria.jobField() != null) {
            engineerBaseWhere.append("\n                      AND m.dutypart = :jobField");
            params.put("jobField", criteria.jobField());
        }
    }

    private void appendCompletionFilters(
            CompletionSearchCriteria criteria,
            StringBuilder outerWhere,
            Map<String, Object> params
    ) {
        if (criteria.educationRegistered() != null) {
            outerWhere.append("\n                  AND COALESCE(lc.education_registered, FALSE) = :educationRegistered");
            params.put("educationRegistered", criteria.educationRegistered());
        }
        if (criteria.recentEducationStartDate1() != null) {
            EducationReminderDateUtils.appendDateFilterCondition(
                    outerWhere,
                    params,
                    "lc.education_start_date_1",
                    "recentEducationStartDate1",
                    criteria.recentEducationStartDate1()
            );
        }
        if (criteria.recentEducationStartDate2() != null) {
            EducationReminderDateUtils.appendDateFilterCondition(
                    outerWhere,
                    params,
                    "lc.education_start_date_2",
                    "recentEducationStartDate2",
                    criteria.recentEducationStartDate2()
            );
        }
    }

    @Transactional
    public EducationReminderCompletionResponse saveCompletion(EducationReminderCompletionRequest request) {
        EducationReminderCompletionRequest normalized = normalize(request);
        String actor = AuditActorResolver.resolve();
        Map<String, Object> params = completionWriteParams(normalized, actor);

        if (existsCompletion(normalized.engrId(), normalized.educationCode())) {
            updateCompletion(params);
        } else {
            insertCompletion(params);
        }

        return findCompletion(normalized.engrId(), normalized.educationCode());
    }

    @Transactional
    public EducationReminderNotificationPhoneResponse saveNotificationPhone(String engrId, EducationReminderNotificationPhoneRequest request) {
        String normalizedEngineerId = required(engrId, "engrId", ENGINEER_ID_MAX_LENGTH);
        String phoneNo = normalizePhoneNo(request.phoneNo());

        validateEngineerExists(normalizedEngineerId);

        if (!StringUtils.hasText(phoneNo)) {
            deleteNotificationPhone(normalizedEngineerId);
            return new EducationReminderNotificationPhoneResponse(normalizedEngineerId, "");
        }

        jdbcClient.sql("""
                        INSERT INTO education_reminder_phone_numbers (
                            engr_id,
                            phone_no
                        )
                        VALUES (
                            :engrId,
                            :phoneNo
                        )
                        ON CONFLICT (engr_id) DO UPDATE
                        SET phone_no = EXCLUDED.phone_no
                        """)
                .param("engrId", normalizedEngineerId)
                .param("phoneNo", phoneNo)
                .update();

        return new EducationReminderNotificationPhoneResponse(normalizedEngineerId, phoneNo);
    }

    @Transactional
    public void deleteNotificationPhone(String engrId) {
        String normalizedEngineerId = required(engrId, "engrId", ENGINEER_ID_MAX_LENGTH);
        jdbcClient.sql("""
                        DELETE FROM education_reminder_phone_numbers
                        WHERE engr_id = :engrId
                        """)
                .param("engrId", normalizedEngineerId)
                .update();
    }

    private EducationReminderCompletionResponse findCompletion(String engrId, String educationCode) {
        return findCompletions(null, null, null, null, null, null, null).stream()
                .filter(item -> item.engineerId().equals(engrId) && item.educationCode().equals(educationCode))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Education reminder completion not found."));
    }

    private EducationReminderCompletionRequest normalize(EducationReminderCompletionRequest request) {
        String engrId = required(request.engrId(), "engrId", ENGINEER_ID_MAX_LENGTH);
        String educationCode = required(request.educationCode(), "educationCode", CODE_MAX_LENGTH);
        if (request.educationRegistered() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "educationRegistered is required.");
        }
        StringValues.validateMaxLength(request.remark(), REMARK_MAX_LENGTH, "remark");

        return new EducationReminderCompletionRequest(
                engrId,
                educationCode,
                EducationReminderDateUtils.normalizeDateForResponse(request.educationStartDate1()),
                EducationReminderDateUtils.normalizeDateForResponse(request.educationStartDate2()),
                request.educationRegistered(),
                StringUtils.hasText(request.remark()) ? request.remark().trim() : ""
        );
    }

    private EducationReminderCompletionResponse mapCompletion(ResultSet rs) throws SQLException {
        String engineerId = rs.getString("engr_id");
        String educationCode = rs.getString("education_code");
        String recentEducationStartDate1 = EducationReminderDateUtils.normalizeDateForResponse(rs.getString("education_start_date_1"));
        String recentEducationStartDate2 = EducationReminderDateUtils.normalizeDateForResponse(rs.getString("education_start_date_2"));
        String cycleUnit = rs.getString("cycle_unit");
        int cycleValue = rs.getInt("cycle_value");
        String scheduledEducation1 = EducationReminderDateUtils.addCycle(recentEducationStartDate1, cycleUnit, cycleValue);
        String scheduledEducation2 = EducationReminderDateUtils.addCycle(recentEducationStartDate2, cycleUnit, cycleValue);
        boolean educationRegistered = rs.getBoolean("education_registered");

        return new EducationReminderCompletionResponse(
                engineerId + "::" + educationCode,
                engineerId,
                rs.getString("namekor"),
                rs.getString("deptname"),
                rs.getString("grade"),
                rs.getString("retireyn"),
                rs.getString("dutypart"),
                rs.getString("propart"),
                rs.getString("has_professional_cert"),
                rs.getString("professional_cert_names"),
                educationCode,
                rs.getString("education_name"),
                recentEducationStartDate1,
                recentEducationStartDate2,
                scheduledEducation1,
                scheduledEducation2,
                highlightResolver.resolve(scheduledEducation1, scheduledEducation2, educationRegistered),
                educationRegistered,
                StringUtils.hasText(rs.getString("remark")) ? rs.getString("remark") : "",
                timestampToString(rs.getTimestamp("created_at")),
                rs.getString("created_id"),
                timestampToString(rs.getTimestamp("last_changed_at")),
                rs.getString("last_changed_id")
        );
    }

    private String like(String value) {
        return StringUtils.hasText(value) ? "%" + value.trim().toLowerCase() + "%" : null;
    }

    private boolean isNotificationTarget(EducationReminderCompletionResponse row) {
        int currentYear = LocalDate.now().getYear();
        return isDateInYear(row.scheduledEducation1(), currentYear) || isDateInYear(row.scheduledEducation2(), currentYear);
    }

    private boolean isDateInYear(String value, int year) {
        LocalDate date = EducationReminderDateUtils.parseResponseDate(value);
        return date != null && date.getYear() == year;
    }

    private Map<String, String> findPhoneNumbersByEngineerIds(Collection<String> engineerIds) {
        if (engineerIds.isEmpty()) {
            return Map.of();
        }

        return jdbcClient.sql("""
                        SELECT engr_id, phone_no
                        FROM education_reminder_phone_numbers
                        WHERE engr_id IN (:engrIds)
                        """)
                .param("engrIds", engineerIds)
                .query((rs, rowNum) -> Map.entry(rs.getString("engr_id"), rs.getString("phone_no")))
                .stream()
                .collect(java.util.stream.Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> StringUtils.hasText(entry.getValue()) ? entry.getValue().trim() : "",
                        (left, right) -> left,
                        LinkedHashMap::new
                ));
    }

    private String nullIfBlank(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String required(String value, String fieldName, int maxLength) {
        String normalized = StringValues.required(value, fieldName);
        StringValues.validateMaxLength(normalized, maxLength, fieldName);
        return normalized;
    }

    private String normalizePhoneNo(String value) {
        String normalized = StringUtils.hasText(value) ? value.trim() : "";
        StringValues.validateMaxLength(normalized, PHONE_NO_MAX_LENGTH, "phoneNo");
        return normalized;
    }

    private void validateEngineerExists(String engrId) {
        Integer existingCount = jdbcClient.sql("""
                        SELECT COUNT(*)
                        FROM pq_engineer_master
                        WHERE engr_id = :engrId
                        """)
                .param("engrId", engrId)
                .query(Integer.class)
                .single();
        if (existingCount == null || existingCount == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Engineer not found.");
        }
    }

    private boolean existsCompletion(String engrId, String educationCode) {
        Integer existingCount = jdbcClient.sql("""
                        SELECT COUNT(*)
                        FROM education_management
                        WHERE engr_id = :engrId
                          AND education_code = :educationCode
                        """)
                .param("engrId", engrId)
                .param("educationCode", educationCode)
                .query(Integer.class)
                .single();
        return existingCount != null && existingCount > 0;
    }

    private Map<String, Object> completionWriteParams(EducationReminderCompletionRequest request, String actor) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("engrId", request.engrId());
        params.put("educationCode", request.educationCode());
        params.put("educationStartDate1", EducationReminderDateUtils.normalizeDateForStorage(request.educationStartDate1()));
        params.put("educationStartDate2", EducationReminderDateUtils.normalizeDateForStorage(request.educationStartDate2()));
        params.put("educationRegistered", request.educationRegistered());
        params.put("remark", request.remark());
        params.put("actor", actor);
        return params;
    }

    private void updateCompletion(Map<String, Object> params) {
        jdbcClient.sql("""
                        UPDATE education_management
                        SET education_start_date_1 = :educationStartDate1,
                            education_start_date_2 = :educationStartDate2,
                            education_registered = :educationRegistered,
                            remark = :remark,
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = :actor
                        WHERE engr_id = :engrId
                          AND education_code = :educationCode
                        """)
                .params(params)
                .update();
    }

    private void insertCompletion(Map<String, Object> params) {
        jdbcClient.sql("""
                        INSERT INTO education_management (
                            engr_id,
                            education_code,
                            education_start_date_1,
                            education_start_date_2,
                            education_registered,
                            remark,
                            created_at,
                            created_id,
                            last_changed_at,
                            last_changed_id
                        )
                        VALUES (
                            :engrId,
                            :educationCode,
                            :educationStartDate1,
                            :educationStartDate2,
                            :educationRegistered,
                            :remark,
                            CURRENT_TIMESTAMP,
                            :actor,
                            CURRENT_TIMESTAMP,
                            :actor
                        )
                        """)
                .params(params)
                .update();
    }

    private String timestampToString(Timestamp value) {
        return value == null ? null : value.toLocalDateTime().toString();
    }
}
