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
import com.cheil.cheil_be.common.crypto.Aes256CryptoService;
import com.cheil.cheil_be.common.security.AuditActorResolver;
import com.cheil.cheil_be.common.text.StringValues;

/** 교육 대상자의 이수 현황과 알림용 연락처를 조회·관리하는 서비스. */
@Service
@RequiredArgsConstructor
public class EducationReminderCompletionService {

    private static final int CODE_MAX_LENGTH = 50;
    private static final int ENGINEER_ID_MAX_LENGTH = 20;
    private static final int PHONE_NO_MAX_LENGTH = 50;
    private static final int REMARK_MAX_LENGTH = 4000;

    private record EducationCycle(String unit, int value) {
    }

    private final JdbcClient jdbcClient;
    private final EducationReminderCompletionHighlightResolver highlightResolver;
    private final Aes256CryptoService aes256CryptoService;

    private record CompletionSearchCriteria(
            String name,
            Boolean educationRegistered,
            String specialtyField,
            String jobField,
            String scheduledEducationYear,
            Integer upcomingWithinDays,
            List<String> educationCodes
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
        private LocalDate deadline;

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
            updateDeadline(row.scheduledEducation1());
            updateDeadline(row.scheduledEducation2());
            if (row.highlightTone() == EducationReminderHighlightTone.OVERDUE) {
                highlightTone = EducationReminderHighlightTone.OVERDUE;
            } else if (row.highlightTone() == EducationReminderHighlightTone.UPCOMING && highlightTone == EducationReminderHighlightTone.NONE) {
                highlightTone = EducationReminderHighlightTone.UPCOMING;
            }
        }

        private void updateDeadline(String value) {
            LocalDate candidate = EducationReminderDateUtils.parseResponseDate(value);
            if (candidate == null || deadline != null && distanceFromToday(candidate) >= distanceFromToday(deadline)) {
                return;
            }
            deadline = candidate;
        }

        private long distanceFromToday(LocalDate date) {
            return Math.abs(java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), date));
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
                    deadline == null ? "" : deadline.toString(),
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
            String scheduledEducationYear,
            Integer upcomingWithinDays,
            List<String> educationCodes
    ) {
        CompletionSearchCriteria criteria = normalizeSearchCriteria(
                name,
                educationRegistered,
                specialtyField,
                jobField,
                scheduledEducationYear,
                upcomingWithinDays,
                educationCodes
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
                        m.design_grade,
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
                assigned_educations AS (
                    SELECT
                        eb.engineer_id AS engr_id,
                        eb.basic_info_code AS education_code,
                        b.name AS education_name,
                        b.cycle_unit,
                        b.cycle_value
                    FROM education_reminder_basic_info_engineers eb
                    JOIN education_reminder_basic_infos b ON b.code = eb.basic_info_code
                ),
                target_matrix AS (
                    SELECT
                        e.engr_id,
                        e.namekor,
                        e.deptname,
                        e.grade,
                        e.design_grade,
                        e.retireyn,
                        e.dutypart,
                        e.propart,
                        a.education_code,
                        a.education_name,
                        a.cycle_unit,
                        a.cycle_value,
                        CASE WHEN p.engr_id IS NOT NULL THEN 'Y' ELSE 'N' END AS has_professional_cert,
                        COALESCE(p.professional_cert_names, '') AS professional_cert_names
                    FROM engineer_base e
                    LEFT JOIN professional_engineers p ON p.engr_id = e.engr_id
                    JOIN assigned_educations a ON a.engr_id = e.engr_id
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
                ),
                completion_view AS (
                    SELECT
                        t.engr_id,
                        t.namekor,
                        t.deptname,
                        t.grade,
                        t.design_grade,
                        t.retireyn,
                        t.dutypart,
                        t.propart,
                        t.education_code,
                        t.education_name,
                        t.cycle_unit,
                        t.cycle_value,
                        t.has_professional_cert,
                        t.professional_cert_names,
                        lc.education_start_date_1,
                        lc.education_start_date_2,
                        COALESCE(lc.education_registered, FALSE) AS education_registered,
                        lc.remark,
                        lc.created_at,
                        lc.created_id,
                        lc.last_changed_at,
                        lc.last_changed_id,
                        CASE
                            WHEN NULLIF(lc.education_start_date_1, '') IS NULL THEN ''
                            WHEN t.cycle_unit = 'MONTH' THEN TO_CHAR(
                                TO_DATE(lc.education_start_date_1, 'YYYYMMDD') + MAKE_INTERVAL(months => t.cycle_value),
                                'YYYYMMDD'
                            )
                            ELSE TO_CHAR(
                                TO_DATE(lc.education_start_date_1, 'YYYYMMDD') + MAKE_INTERVAL(years => t.cycle_value),
                                'YYYYMMDD'
                            )
                        END AS scheduled_education_1,
                        CASE
                            WHEN NULLIF(lc.education_start_date_2, '') IS NULL THEN ''
                            WHEN t.cycle_unit = 'MONTH' THEN TO_CHAR(
                                TO_DATE(lc.education_start_date_2, 'YYYYMMDD') + MAKE_INTERVAL(months => t.cycle_value),
                                'YYYYMMDD'
                            )
                            ELSE TO_CHAR(
                                TO_DATE(lc.education_start_date_2, 'YYYYMMDD') + MAKE_INTERVAL(years => t.cycle_value),
                                'YYYYMMDD'
                            )
                        END AS scheduled_education_2
                    FROM target_matrix t
                    LEFT JOIN latest_completion lc
                      ON lc.engr_id = t.engr_id
                     AND lc.education_code = t.education_code
                )
                SELECT
                    cv.engr_id,
                    cv.namekor,
                    cv.deptname,
                    cv.grade,
                    cv.design_grade,
                    cv.retireyn,
                    cv.dutypart,
                    cv.propart,
                    cv.has_professional_cert,
                    cv.professional_cert_names,
                    cv.education_code,
                    cv.education_name,
                    cv.cycle_unit,
                    cv.cycle_value,
                    cv.education_start_date_1,
                    cv.education_start_date_2,
                    cv.education_registered,
                    cv.remark,
                    p.phone_no,
                    cv.created_at,
                    cv.created_id,
                    cv.last_changed_at,
                    cv.last_changed_id
                FROM completion_view cv
                LEFT JOIN engineer_contacts p ON p.engr_id = cv.engr_id
                %s
                ORDER BY cv.namekor, cv.engr_id, cv.education_name
                """.formatted(queryParts.engineerBaseWhere(), queryParts.outerWhere());
    }

    private CompletionSearchCriteria normalizeSearchCriteria(
            String name,
            Boolean educationRegistered,
            String specialtyField,
            String jobField,
            String scheduledEducationYear,
            Integer upcomingWithinDays,
            List<String> educationCodes
    ) {
        return new CompletionSearchCriteria(
                like(name),
                educationRegistered,
                nullIfBlank(specialtyField),
                nullIfBlank(jobField),
                EducationReminderDateUtils.normalizeOptionalDateFilter(scheduledEducationYear),
                upcomingWithinDays,
                educationCodes == null ? null : educationCodes.stream()
                        .filter(StringUtils::hasText)
                        .map(String::trim)
                        .distinct()
                        .toList()
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
        engineerBaseWhere.append("\n                      AND COALESCE(m.retireyn, 'N') = 'N'");

        if (criteria.name() != null) {
            engineerBaseWhere.append("\n                      AND LOWER(m.namekor) LIKE :name");
            params.put("name", criteria.name());
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
            outerWhere.append("\n                  AND COALESCE(cv.education_registered, FALSE) = :educationRegistered");
            params.put("educationRegistered", criteria.educationRegistered());
        }
        if (criteria.scheduledEducationYear() != null) {
            EducationReminderDateUtils.appendDateFilterCondition(
                    outerWhere,
                    params,
                    scheduledEducationDateExpression("cv.education_start_date_1", "cv.cycle_unit", "cv.cycle_value"),
                    scheduledEducationDateExpression("cv.education_start_date_2", "cv.cycle_unit", "cv.cycle_value"),
                    "scheduledEducationYear",
                    criteria.scheduledEducationYear()
            );
        }
        if (criteria.upcomingWithinDays() != null) {
            String scheduledDate1 = scheduledEducationDateExpression("cv.education_start_date_1", "cv.cycle_unit", "cv.cycle_value");
            String scheduledDate2 = scheduledEducationDateExpression("cv.education_start_date_2", "cv.cycle_unit", "cv.cycle_value");
            outerWhere.append("\n                  AND (TO_DATE(NULLIF(%s, ''), 'YYYYMMDD') BETWEEN CURRENT_DATE - MAKE_INTERVAL(days => :upcomingWithinDays) AND CURRENT_DATE".formatted(scheduledDate1));
            outerWhere.append("\n                       OR TO_DATE(NULLIF(%s, ''), 'YYYYMMDD') BETWEEN CURRENT_DATE - MAKE_INTERVAL(days => :upcomingWithinDays) AND CURRENT_DATE)".formatted(scheduledDate2));
            params.put("upcomingWithinDays", criteria.upcomingWithinDays());
        }
        if (criteria.educationCodes() != null && !criteria.educationCodes().isEmpty()) {
            outerWhere.append("\n                  AND cv.education_code IN (:educationCodes)");
            params.put("educationCodes", criteria.educationCodes());
        }
    }

    private String scheduledEducationDateExpression(String educationStartDateColumn, String cycleUnitColumn, String cycleValueColumn) {
        return """
                CASE
                    WHEN NULLIF(%s, '') IS NULL THEN ''
                    WHEN %s = 'MONTH' THEN TO_CHAR(
                        TO_DATE(%s, 'YYYYMMDD') + MAKE_INTERVAL(months => %s),
                        'YYYYMMDD'
                    )
                    ELSE TO_CHAR(
                        TO_DATE(%s, 'YYYYMMDD') + MAKE_INTERVAL(years => %s),
                        'YYYYMMDD'
                    )
                END
                """.formatted(
                educationStartDateColumn,
                cycleUnitColumn,
                educationStartDateColumn,
                cycleValueColumn,
                educationStartDateColumn,
                cycleValueColumn
        ).trim();
    }

    @Transactional
    public EducationReminderCompletionResponse saveCompletion(EducationReminderCompletionRequest request) {
        EducationReminderCompletionRequest normalized = normalize(request);
        String actor = AuditActorResolver.resolve();

        if (Boolean.TRUE.equals(normalized.advanceCycle()) && normalized.educationRegistered()) {
            Map<String, Object> completedParams = completionWriteParams(normalized, actor);
            if (existsCompletion(normalized.engrId(), normalized.educationCode())) {
                updateCompletion(completedParams);
            } else {
                insertCompletion(completedParams);
            }

            EducationReminderCompletionRequest nextCycle = advanceToNextCycle(normalized);
            insertCompletion(completionWriteParams(nextCycle, actor));

            return findCompletion(nextCycle.engrId(), nextCycle.educationCode());
        }

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
            return new EducationReminderNotificationPhoneResponse(normalizedEngineerId, "", null, null, null, null);
        }

        String actor = AuditActorResolver.resolve();
        return jdbcClient.sql("""
                        INSERT INTO engineer_contacts (
                            engr_id,
                            phone_no,
                            created_id,
                            last_changed_id
                        )
                        VALUES (
                            :engrId,
                            :phoneNo,
                            :actor,
                            :actor
                        )
                        ON CONFLICT (engr_id) DO UPDATE
                        SET phone_no = EXCLUDED.phone_no,
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = EXCLUDED.last_changed_id
                        RETURNING created_at, created_id, last_changed_at, last_changed_id
                        """)
                .param("engrId", normalizedEngineerId)
                .param("phoneNo", aes256CryptoService.encrypt(phoneNo))
                .param("actor", actor)
                .query((rs, rowNum) -> new EducationReminderNotificationPhoneResponse(
                        normalizedEngineerId,
                        phoneNo,
                        timestampToString(rs.getTimestamp("created_at")),
                        rs.getString("created_id"),
                        timestampToString(rs.getTimestamp("last_changed_at")),
                        rs.getString("last_changed_id")
                ))
                .single();

    }

    @Transactional
    public void deleteNotificationPhone(String engrId) {
        String normalizedEngineerId = required(engrId, "engrId", ENGINEER_ID_MAX_LENGTH);
        jdbcClient.sql("""
                        DELETE FROM engineer_contacts
                        WHERE engr_id = :engrId
                        """)
                .param("engrId", normalizedEngineerId)
                .update();
    }

    private EducationReminderCompletionResponse findCompletion(String engrId, String educationCode) {
        return findCompletions(null, null, null, null, null, null, null, null).stream()
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
                StringUtils.hasText(request.remark()) ? request.remark().trim() : "",
                Boolean.TRUE.equals(request.advanceCycle())
        );
    }

    private EducationReminderCompletionRequest advanceToNextCycle(EducationReminderCompletionRequest request) {
        EducationCycle cycle = jdbcClient.sql("""
                        SELECT cycle_unit, cycle_value
                        FROM education_reminder_basic_infos
                        WHERE code = :educationCode
                        """)
                .param("educationCode", request.educationCode())
                .query((rs, rowNum) -> new EducationCycle(rs.getString("cycle_unit"), rs.getInt("cycle_value")))
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Education basic information not found."));

        return new EducationReminderCompletionRequest(
                request.engrId(),
                request.educationCode(),
                EducationReminderDateUtils.addCycle(request.educationStartDate1(), cycle.unit(), cycle.value()),
                EducationReminderDateUtils.addCycle(request.educationStartDate2(), cycle.unit(), cycle.value()),
                false,
                "",
                false
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
                rs.getString("design_grade"),
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
                aes256CryptoService.decrypt(rs.getString("phone_no")),
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
                        FROM engineer_contacts
                        WHERE engr_id IN (:engrIds)
                        """)
                .param("engrIds", engineerIds)
                .query((rs, rowNum) -> Map.entry(rs.getString("engr_id"), aes256CryptoService.decrypt(rs.getString("phone_no"))))
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
        String normalized = StringUtils.hasText(value) ? value.replaceAll("\\D", "") : "";
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
