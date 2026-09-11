package com.cheil.cheil_be.application.pqparticipatingengineer.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
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

import com.cheil.cheil_be.adapter.in.web.pqparticipatingengineer.PqParticipatingEngineerCandidateResponse;
import com.cheil.cheil_be.adapter.in.web.pqparticipatingengineer.PqParticipatingEngineerRequest;
import com.cheil.cheil_be.adapter.in.web.pqparticipatingengineer.PqParticipatingEngineerResponse;
import com.cheil.cheil_be.adapter.in.web.pqparticipatingengineer.ReplacePqParticipatingEngineersRequest;
import com.cheil.cheil_be.application.engineer.EngineerAdminService;
import com.cheil.cheil_be.application.engineer.EngineerDtos;
import com.cheil.cheil_be.application.relatedprojecthistorycondition.ProjectHistoryCondition;
import com.cheil.cheil_be.application.relatedprojecthistorycondition.ProjectHistoryConditionMetadata;
import com.cheil.cheil_be.application.relatedprojecthistorycondition.ProjectHistoryConditionMetadataService;
import com.cheil.cheil_be.common.security.AuditActorResolver;

/** PQ 공고에 참여하는 기술인의 후보·선정 목록을 조회하고 변경하는 서비스. */
@Service
@RequiredArgsConstructor
public class PqParticipatingEngineerQueryService {

    private static final Set<String> COMPARISON_OPERATORS = Set.of("=", "!=", ">=", "<=", ">", "<", "LIKE", "BETWEEN");
    private final JdbcClient jdbcClient;
    private final EngineerAdminService engineerAdminService;
    private final ProjectHistoryConditionMetadataService conditionMetadataService;
    private final Gson gson = new Gson();

    @Transactional(readOnly = true)
    public Page<PqParticipatingEngineerCandidateResponse> findCandidates(
            Long bidSeq,
            String workDutyId,
            String keyword,
            String certificationName,
            String constructionManagementGrade,
            String designGrade,
            String jobField,
            String specialtyField,
            String retireYn,
            String projectHistoryConditions,
            Pageable pageable
    ) {
        List<ProjectHistoryCondition> historyConditions = parseProjectHistoryConditions(projectHistoryConditions);
        Map<String, ProjectHistoryConditionMetadata> conditionMetadata = historyConditions.isEmpty()
                ? Map.of()
                : conditionMetadataService.findAll();
        QueryParts queryParts = buildCandidateWhere(
                bidSeq,
                workDutyId,
                keyword,
                certificationName,
                constructionManagementGrade,
                designGrade,
                jobField,
                specialtyField,
                retireYn,
                historyConditions,
                conditionMetadata
        );

        String selectSql = """
                SELECT
                    m.engr_id,
                    m.namekor,
                    m.birthday,
                    m.deptname,
                    m.grade,
                    m.dutypart,
                    m.propart,
                    m.design_grade,
                    m.construction_management_grade,
                    m.retireyn
                FROM pq_engineer_master m
                %s
                ORDER BY m.namekor NULLS LAST, m.engr_id
                LIMIT :limit OFFSET :offset
                """.formatted(queryParts.whereSql());
        Map<String, Object> selectParams = new LinkedHashMap<>(queryParts.params());
        selectParams.put("limit", pageable.getPageSize());
        selectParams.put("offset", pageable.getOffset());

        List<PqParticipatingEngineerCandidateResponse> rows = jdbcClient.sql(selectSql)
                .params(selectParams)
                .query((rs, rowNum) -> new PqParticipatingEngineerCandidateResponse(
                        rs.getString("engr_id"),
                        rs.getString("namekor"),
                        rs.getString("birthday"),
                        rs.getString("deptname"),
                        rs.getString("grade"),
                        rs.getString("dutypart"),
                        rs.getString("propart"),
                        rs.getString("design_grade"),
                        rs.getString("construction_management_grade"),
                        rs.getString("retireyn")
                ))
                .list();

        Long total = jdbcClient.sql("SELECT COUNT(*) FROM pq_engineer_master m " + queryParts.whereSql())
                .params(queryParts.params())
                .query(Long.class)
                .single();

        return new PageImpl<>(rows, pageable, total == null ? 0L : total);
    }

    @Transactional(readOnly = true)
    public List<PqParticipatingEngineerResponse> findSelected(Long bidSeq, String workDutyId) {
        if (bidSeq == null) {
            return List.of();
        }

        StringBuilder sql = new StringBuilder("""
                SELECT
                    s.bid_seq,
                    s.work_duty_id,
                    s.engr_id,
                    COALESCE(s.priority, ROW_NUMBER() OVER (ORDER BY m.namekor NULLS LAST, s.engr_id)) AS priority,
                    s.responsibility,
                    m.namekor,
                    m.birthday,
                    m.deptname,
                    m.grade,
                    m.dutypart,
                    m.propart,
                    m.retireyn
                FROM pq_find_engr_info s
                LEFT JOIN pq_engineer_master m ON m.engr_id = s.engr_id
                WHERE s.bid_seq = :bidSeq
                """);
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("bidSeq", bidSeq);
        if (StringUtils.hasText(workDutyId)) {
            sql.append(" AND s.work_duty_id = :workDutyId");
            params.put("workDutyId", workDutyId.trim());
        }
        sql.append(" ORDER BY CASE WHEN s.priority IS NULL THEN 1 ELSE 0 END, s.priority NULLS LAST, "
                + "CASE LOWER(COALESCE(s.responsibility, '')) "
                + "WHEN '사업책임' THEN 1 WHEN '책임' THEN 2 WHEN '참여' THEN 3 WHEN '실무' THEN 4 ELSE 5 END, "
                + "m.namekor NULLS LAST, s.engr_id");

        return jdbcClient.sql(sql.toString())
                .params(params)
                .query((rs, rowNum) -> toSelectedResponse(rs.getLong("bid_seq"), rs.getString("work_duty_id"), rs.getString("engr_id"), rs.getInt("priority"), rs.getString("responsibility"),
                        rs.getString("namekor"), rs.getString("birthday"), rs.getString("deptname"), rs.getString("grade"), rs.getString("dutypart"), rs.getString("propart"), rs.getString("retireyn")))
                .list();
    }

    @Transactional(readOnly = true)
    public List<EngineerDtos.Profile> findSelectedProfiles(Long bidSeq, String workDutyId, String keyword) {
        return findSelectedProfileIds(bidSeq, workDutyId, keyword).stream()
                .map(engineerAdminService::findByEngrId)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EngineerDtos.Profile> findSelectedProfileSummaries(Long bidSeq, String workDutyId, String keyword) {
        if (bidSeq == null) {
            return List.of();
        }

        StringBuilder sql = new StringBuilder("""
                SELECT
                    s.engr_id,
                    CASE LOWER(COALESCE(s.responsibility, ''))
                        WHEN '사업책임' THEN 1
                        WHEN '책임' THEN 2
                        WHEN '참여' THEN 3
                        WHEN '실무' THEN 4
                        ELSE 5
                    END AS responsibility_order,
                    COALESCE(s.priority, 2147483647) AS engineer_priority,
                    m.namekor,
                    m.birthday,
                    m.deptname,
                    m.grade,
                    m.dutypart,
                    m.propart,
                    m.retireyn,
                    v.selected_education_id,
                    v.selected_license_id
                FROM pq_find_engr_info s
                LEFT JOIN pq_engineer_master m ON m.engr_id = s.engr_id
                LEFT JOIN pq_engineer_document_value_settings v
                    ON v.bid_seq = s.bid_seq AND v.engr_id = s.engr_id
                WHERE s.bid_seq = :bidSeq
                """);
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("bidSeq", bidSeq);
        if (StringUtils.hasText(workDutyId)) {
            sql.append(" AND s.work_duty_id = :workDutyId");
            params.put("workDutyId", workDutyId.trim());
        }
        if (StringUtils.hasText(keyword)) {
            sql.append("""
                     AND (
                        LOWER(m.engr_id) LIKE :keyword
                        OR LOWER(m.namekor) LIKE :keyword
                        OR LOWER(m.deptname) LIKE :keyword
                        OR LOWER(m.grade) LIKE :keyword
                        OR LOWER(m.dutypart) LIKE :keyword
                        OR LOWER(m.propart) LIKE :keyword
                    )
                    """);
            params.put("keyword", "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%");
        }
        sql.append(" ORDER BY CASE WHEN s.priority IS NULL THEN 1 ELSE 0 END, s.priority NULLS LAST, "
                + "responsibility_order, m.namekor NULLS LAST, s.engr_id");

        return jdbcClient.sql(sql.toString())
                .params(params)
                .query((rs, rowNum) -> new EngineerDtos.Profile(
                        new EngineerDtos.Basic(
                                rs.getString("engr_id"),
                                rs.getString("namekor"),
                                rs.getString("birthday"),
                                rs.getString("deptname"),
                                rs.getString("grade"),
                                null,
                                null,
                                null,
                                rs.getString("retireyn"),
                                rs.getString("dutypart"),
                                rs.getString("propart")
                        ),
                        List.of(), List.of(), List.of(), List.of(), List.of(), List.of()
                ))
                .list();
    }

    private List<String> findSelectedProfileIds(Long bidSeq, String workDutyId, String keyword) {
        if (bidSeq == null) {
            return List.of();
        }

        StringBuilder sql = new StringBuilder("""
                SELECT
                    s.engr_id,
                    m.namekor
                FROM pq_find_engr_info s
                LEFT JOIN pq_engineer_master m ON m.engr_id = s.engr_id
                WHERE s.bid_seq = :bidSeq
                """);
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("bidSeq", bidSeq);
        if (StringUtils.hasText(workDutyId)) {
            sql.append(" AND s.work_duty_id = :workDutyId");
            params.put("workDutyId", workDutyId.trim());
        }
        if (StringUtils.hasText(keyword)) {
            sql.append("""
                     AND (
                        LOWER(m.engr_id) LIKE :keyword
                        OR LOWER(m.namekor) LIKE :keyword
                        OR LOWER(m.deptname) LIKE :keyword
                        OR LOWER(m.grade) LIKE :keyword
                        OR LOWER(m.dutypart) LIKE :keyword
                        OR LOWER(m.propart) LIKE :keyword
                    )
                    """);
            params.put("keyword", "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%");
        }
        sql.append(" ORDER BY m.namekor NULLS LAST, s.engr_id");

        return jdbcClient.sql(sql.toString())
                .params(params)
                .query((rs, rowNum) -> rs.getString("engr_id"))
                .list();
    }

    @Transactional
    public PqParticipatingEngineerResponse create(PqParticipatingEngineerRequest request) {
        Long bidSeq = requiredBidSeq(request.bidSeq());
        String workDutyId = required(request.workDutyId(), "workDutyId");
        String engrId = required(request.engrId(), "engrId");
        upsert(bidSeq, workDutyId, engrId, request.priority(), request.responsibility());
        return findSelectedOne(bidSeq, workDutyId, engrId);
    }

    @Transactional
    public PqParticipatingEngineerResponse update(Long bidSeq, String workDutyId, String engrId, PqParticipatingEngineerRequest request) {
        String nextWorkDutyId = StringUtils.hasText(request.workDutyId()) ? request.workDutyId().trim() : required(workDutyId, "workDutyId");
        String nextEngrId = StringUtils.hasText(request.engrId()) ? request.engrId().trim() : required(engrId, "engrId");
        Long nextBidSeq = request.bidSeq() == null ? requiredBidSeq(bidSeq) : request.bidSeq();

        int updated = jdbcClient.sql("""
                        UPDATE pq_find_engr_info
                        SET priority = :priority,
                            responsibility = :responsibility,
                            created_id = COALESCE(created_id, :actor),
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = :actor
                        WHERE bid_seq = :bidSeq AND work_duty_id = :workDutyId AND engr_id = :engrId
                        """)
                .param("bidSeq", requiredBidSeq(bidSeq))
                .param("workDutyId", required(workDutyId, "workDutyId"))
                .param("engrId", required(engrId, "engrId"))
                .param("priority", request.priority())
                .param("responsibility", normalize(request.responsibility()))
                .param("actor", AuditActorResolver.resolve())
                .update();
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "PQ참여 기술자 정보를 찾을 수 없습니다.");
        }
        return findSelectedOne(nextBidSeq, nextWorkDutyId, nextEngrId);
    }

    @Transactional
    public void delete(Long bidSeq, String workDutyId, String engrId) {
        int deleted = jdbcClient.sql("""
                        DELETE FROM pq_find_engr_info
                        WHERE bid_seq = :bidSeq AND work_duty_id = :workDutyId AND engr_id = :engrId
                        """)
                .param("bidSeq", requiredBidSeq(bidSeq))
                .param("workDutyId", required(workDutyId, "workDutyId"))
                .param("engrId", required(engrId, "engrId"))
                .update();
        if (deleted != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "PQ참여 기술자 정보를 찾을 수 없습니다.");
        }
    }

    @Transactional
    public List<PqParticipatingEngineerResponse> replace(ReplacePqParticipatingEngineersRequest request) {
        Long bidSeq = requiredBidSeq(request.bidSeq());
        String workDutyId = required(request.workDutyId(), "workDutyId");

        jdbcClient.sql("DELETE FROM pq_find_engr_info WHERE bid_seq = :bidSeq AND work_duty_id = :workDutyId")
                .param("bidSeq", bidSeq)
                .param("workDutyId", workDutyId)
                .update();

        Set<String> engineerIds = new LinkedHashSet<>();
        if (request.engineers() != null) {
            request.engineers().stream()
                    .filter(item -> StringUtils.hasText(item.engrId()))
                    .forEach(item -> {
                        String engineerId = normalize(item.engrId());
                        if (engineerIds.add(engineerId)) {
                            upsert(bidSeq, workDutyId, engineerId, item.priority(), item.responsibility());
                        }
                    });
        }
        return findSelected(bidSeq, workDutyId);
    }

    private QueryParts buildCandidateWhere(
            Long bidSeq,
            String workDutyId,
            String keyword,
            String certificationName,
            String constructionManagementGrade,
            String designGrade,
            String jobField,
            String specialtyField,
            String retireYn,
            List<ProjectHistoryCondition> projectHistoryConditions,
            Map<String, ProjectHistoryConditionMetadata> conditionMetadata
    ) {
        List<String> conditions = new ArrayList<>();
        Map<String, Object> params = new LinkedHashMap<>();

        if (StringUtils.hasText(keyword)) {
            conditions.add("""
                    (
                        LOWER(m.namekor) LIKE :keyword
                        OR LOWER(m.deptname) LIKE :keyword
                        OR LOWER(m.grade) LIKE :keyword
                        OR LOWER(m.dutypart) LIKE :keyword
                        OR LOWER(m.propart) LIKE :keyword
                    )
                    """);
            params.put("keyword", "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%");
        }
        addEquals(conditions, params, "m.retireyn", "retireYn", retireYn);
        addEquals(conditions, params, "m.construction_management_grade", "constructionManagementGrade", constructionManagementGrade);
        addEquals(conditions, params, "m.design_grade", "designGrade", designGrade);
        addEquals(conditions, params, "m.dutypart", "jobField", jobField);
        addEquals(conditions, params, "m.propart", "specialtyField", specialtyField);

        if (StringUtils.hasText(certificationName)) {
            conditions.add("""
                    m.engr_id IN (
                        SELECT l.engr_id
                        FROM pq_engineer_license l
                        WHERE LOWER(l.license_code) LIKE :certificationName
                    )
                    """);
            params.put("certificationName", "%" + certificationName.trim().toLowerCase(Locale.ROOT) + "%");
        }

        if (bidSeq != null) {
            conditions.add("""
                    m.engr_id NOT IN (
                        SELECT s.engr_id
                        FROM pq_find_engr_info s
                        WHERE s.bid_seq = :excludeBidSeq
                          AND (:excludeWorkDutyId IS NULL OR s.work_duty_id = :excludeWorkDutyId)
                    )
                    """);
            params.put("excludeBidSeq", bidSeq);
            params.put("excludeWorkDutyId", normalize(workDutyId));
        }

        String historySql = buildProjectHistoryConditionSql(projectHistoryConditions, params, conditionMetadata);
        if (StringUtils.hasText(historySql)) {
            conditions.add(historySql);
        }

        if (conditions.isEmpty()) {
            return new QueryParts("", params);
        }
        return new QueryParts("WHERE " + String.join("\nAND ", conditions), params);
    }

    private String buildProjectHistoryConditionSql(List<ProjectHistoryCondition> projectHistoryConditions, Map<String, Object> params,
            Map<String, ProjectHistoryConditionMetadata> conditionMetadata) {
        List<String> fragments = new ArrayList<>();
        for (int i = 0; i < projectHistoryConditions.size(); i++) {
            ProjectHistoryCondition condition = projectHistoryConditions.get(i);
            String conditionType = normalize(condition.conditionType());
            String fragment = switch (conditionType == null ? "" : conditionType) {
                case "constructionKind" -> constructionKindCondition(condition, params, i);
                case "general" -> generalCondition(condition, params, i, conditionMetadata);
                case "outline" -> outlineCondition(condition, params, i, conditionMetadata);
                default -> "";
            };
            if (!StringUtils.hasText(fragment)) {
                continue;
            }
            String logicalOperator = fragments.isEmpty() ? "" : " " + logicalOperator(condition.logicalOperator()) + " ";
            fragments.add(logicalOperator + fragment);
        }
        if (fragments.isEmpty()) {
            return "";
        }
        return "(" + String.join("", fragments) + ")";
    }

    private String constructionKindCondition(ProjectHistoryCondition condition, Map<String, Object> params, int index) {
        String level1Code = normalize(condition.level1Code());
        if (!StringUtils.hasText(level1Code)) {
            return "";
        }
        String level1Param = "historyLevel1Code" + index;
        String level2Param = "historyLevel2Code" + index;
        String level3Param = "historyLevel3Code" + index;
        params.put(level1Param, level1Code);
        params.put(level2Param, normalize(condition.level2Code()));
        params.put(level3Param, normalize(condition.level3Code()));
        String historyAlias = "h" + index;
        String kindAlias = "k" + index;
        return """
                m.engr_id IN (
                    SELECT %s.engr_id
                    FROM pq_engineer_project_history %s
                    WHERE %s.seq IN (
                        SELECT %s.seq
                        FROM company_performance_construction_kinds %s
                        WHERE %s.level1_code = :%s
                          AND (:%s IS NULL OR %s.level2_code = :%s)
                          AND (:%s IS NULL OR %s.level3_code = :%s)
                    )
                )
                """.formatted(historyAlias, historyAlias, historyAlias, kindAlias, kindAlias, kindAlias,
                level1Param, level2Param, kindAlias, level2Param, level3Param, kindAlias, level3Param);
    }

    private String generalCondition(ProjectHistoryCondition condition, Map<String, Object> params, int index,
            Map<String, ProjectHistoryConditionMetadata> conditionMetadata) {
        ProjectHistoryConditionMetadata metadata = conditionMetadata.get(normalize(condition.generalCode()));
        if (metadata == null) return "";
        String historyAlias = "h" + index;
        String targetAlias = "target" + index;
        String predicate = comparisonPredicate(targetAlias + "." + metadata.column(), condition, params, index, metadata.valueType());
        if (!StringUtils.hasText(predicate)) return "";
        return """
                m.engr_id IN (
                    SELECT %s.engr_id
                    FROM pq_engineer_project_history %s
                    WHERE %s.seq IN (
                        SELECT %s.seq FROM %s %s WHERE %s
                    )
                )
                """.formatted(historyAlias, historyAlias, historyAlias, targetAlias, metadata.table(), targetAlias, predicate);
    }

    private String outlineCondition(ProjectHistoryCondition condition, Map<String, Object> params, int index,
            Map<String, ProjectHistoryConditionMetadata> conditionMetadata) {
        String categoryCode = normalize(condition.outlineCategoryCode());
        String subcategoryCode = normalize(condition.outlineSubcategoryCode());
        if (!StringUtils.hasText(categoryCode) && !StringUtils.hasText(subcategoryCode)) {
            return "";
        }

        String historyAlias = "h" + index;
        String targetAlias = "target" + index;
        List<String> outlineConditions = new ArrayList<>();
        if (StringUtils.hasText(categoryCode)) {
            String paramName = "outlineCategoryCode" + index;
            outlineConditions.add(targetAlias + ".cate_code = :" + paramName);
            params.put(paramName, categoryCode);
        }
        if (StringUtils.hasText(subcategoryCode)) {
            String paramName = "outlineSubcategoryCode" + index;
            outlineConditions.add(targetAlias + ".subcate_code = :" + paramName);
            params.put(paramName, subcategoryCode);
        }
        ProjectHistoryConditionMetadata metadata = conditionMetadata.get(normalize(categoryCode) + normalize(subcategoryCode));
        if (metadata == null) return "";
        String predicate = comparisonPredicate(targetAlias + "." + metadata.column(), condition, params, index,
                metadata.valueType());
        if (StringUtils.hasText(predicate)) {
            outlineConditions.add(predicate);
        }

        return """
                m.engr_id IN (
                    SELECT %s.engr_id
                    FROM pq_engineer_project_history %s
                    WHERE %s.seq IN (
                        SELECT %s.seq FROM %s %s WHERE %s
                    )
                )
                """.formatted(historyAlias, historyAlias, historyAlias, targetAlias, metadata.table(), targetAlias,
                String.join("\nAND ", outlineConditions));
    }

    private String comparisonPredicate(String column, ProjectHistoryCondition condition, Map<String, Object> params, int index) {
        return comparisonPredicate(column, condition, params, index, null);
    }

    private String comparisonPredicate(String column, ProjectHistoryCondition condition, Map<String, Object> params, int index,
            String metadataValueType) {
        String value = normalize(condition.value());
        String operator = operator(condition.operator());
        if (!StringUtils.hasText(value) && !"LIKE".equals(operator)) {
            return "";
        }

        String valueType = StringUtils.hasText(metadataValueType) ? metadataValueType : normalize(condition.valueType());
        boolean numberType = "number".equals(valueType);
        boolean dateType = "date".equals(valueType);
        String expression = numberType ? "CAST(NULLIF(REGEXP_REPLACE(CAST(" + column + " AS TEXT), '[^0-9.-]', '', 'g'), '') AS NUMERIC)" : column;
        String paramName = "historyValue" + index;
        String valueToParamName = "historyValueTo" + index;

        if ("LIKE".equals(operator)) {
            params.put(paramName, "%" + (value == null ? "" : value.toLowerCase(Locale.ROOT)) + "%");
            return "LOWER(CAST(" + column + " AS TEXT)) LIKE :" + paramName;
        }
        if ("BETWEEN".equals(operator)) {
            String valueTo = normalize(condition.valueTo());
            if (!StringUtils.hasText(valueTo)) {
                return "";
            }
            params.put(paramName, typedValue(value, paramName, numberType, dateType));
            params.put(valueToParamName, typedValue(valueTo, valueToParamName, numberType, dateType));
            return expression + " BETWEEN :" + paramName + " AND :" + valueToParamName;
        }

        params.put(paramName, typedValue(value, paramName, numberType, dateType));
        return expression + " " + operator + " :" + paramName;
    }


    private List<ProjectHistoryCondition> parseProjectHistoryConditions(String projectHistoryConditions) {
        if (!StringUtils.hasText(projectHistoryConditions)) {
            return List.of();
        }
        try {
            List<ProjectHistoryCondition> conditions = gson.fromJson(
                    projectHistoryConditions,
                    new TypeToken<List<ProjectHistoryCondition>>() {
                    }.getType()
            );
            return conditions == null ? List.of() : conditions;
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "관련 공사 참여 이력 조건 형식이 올바르지 않습니다.", exception);
        }
    }

    private PqParticipatingEngineerResponse findSelectedOne(Long bidSeq, String workDutyId, String engrId) {
        return findSelected(bidSeq, workDutyId).stream()
                .filter(row -> row.engrId().equals(engrId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PQ참여 기술자 정보를 찾을 수 없습니다."));
    }

    private void upsert(Long bidSeq, String workDutyId, String engrId) {
        jdbcClient.sql("""
                        INSERT INTO pq_find_engr_info (
                            bid_seq, work_duty_id, engr_id, priority, responsibility,
                            created_id, last_changed_at, last_changed_id
                        )
                        VALUES (
                            :bidSeq, :workDutyId, :engrId, :priority, :responsibility,
                            :actor, CURRENT_TIMESTAMP, :actor
                        )
                        ON CONFLICT (bid_seq, work_duty_id, engr_id)
                        DO UPDATE SET
                            priority = EXCLUDED.priority,
                            responsibility = EXCLUDED.responsibility,
                            created_id = COALESCE(pq_find_engr_info.created_id, EXCLUDED.created_id),
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = EXCLUDED.last_changed_id
                        """)
                .param("bidSeq", bidSeq)
                .param("workDutyId", workDutyId)
                .param("engrId", engrId)
                .param("priority", null)
                .param("responsibility", null)
                .param("actor", AuditActorResolver.resolve())
                .update();
    }

    private void upsert(Long bidSeq, String workDutyId, String engrId, Integer priority, String responsibility) {
        jdbcClient.sql("""
                        INSERT INTO pq_find_engr_info (
                            bid_seq, work_duty_id, engr_id, priority, responsibility,
                            created_id, last_changed_at, last_changed_id
                        )
                        VALUES (
                            :bidSeq, :workDutyId, :engrId, :priority, :responsibility,
                            :actor, CURRENT_TIMESTAMP, :actor
                        )
                        ON CONFLICT (bid_seq, work_duty_id, engr_id)
                        DO UPDATE SET
                            priority = EXCLUDED.priority,
                            responsibility = EXCLUDED.responsibility,
                            created_id = COALESCE(pq_find_engr_info.created_id, EXCLUDED.created_id),
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = EXCLUDED.last_changed_id
                        """)
                .param("bidSeq", bidSeq)
                .param("workDutyId", workDutyId)
                .param("engrId", engrId)
                .param("priority", priority)
                .param("responsibility", normalize(responsibility))
                .param("actor", AuditActorResolver.resolve())
                .update();
    }

    private PqParticipatingEngineerResponse toSelectedResponse(
            Long bidSeq,
            String workDutyId,
            String engrId,
            Integer priority,
            String responsibility,
            String name,
            String birthDate,
            String department,
            String position,
            String jobField,
            String specialtyField,
            String retireYn
    ) {
        return new PqParticipatingEngineerResponse(
                bidSeq,
                engrId,
                workDutyId,
                priority,
                responsibility,
                null,
                null,
                name,
                birthDate,
                department,
                position,
                jobField,
                specialtyField,
                retireYn
        );
    }

    private void addEquals(List<String> conditions, Map<String, Object> params, String column, String paramName, String value) {
        String normalized = normalize(value);
        if (!StringUtils.hasText(normalized)) {
            return;
        }
        conditions.add(column + " = :" + paramName);
        params.put(paramName, normalized);
    }

    private Long requiredBidSeq(Long bidSeq) {
        if (bidSeq == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "bidSeq는 필수입니다.");
        }
        return bidSeq;
    }

    private String required(String value, String fieldName) {
        String normalized = normalize(value);
        if (!StringUtils.hasText(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + "는 필수입니다.");
        }
        return normalized;
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String operator(String value) {
        String normalized = normalize(value);
        if (!StringUtils.hasText(normalized)) {
            return "=";
        }
        String operator = normalized.toUpperCase(Locale.ROOT);
        if (!COMPARISON_OPERATORS.contains(operator)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원하지 않는 비교 조건입니다.");
        }
        return operator;
    }

    private String logicalOperator(String value) {
        return "OR".equalsIgnoreCase(normalize(value)) ? "OR" : "AND";
    }

    private BigDecimal number(String value, String fieldName) {
        try {
            return new BigDecimal(value.replace(",", ""));
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + "는 숫자여야 합니다.", exception);
        }
    }

    private Object typedValue(String value, String fieldName, boolean numberType, boolean dateType) {
        if (numberType) {
            return number(value, fieldName);
        }
        if (dateType) {
            return value.replaceAll("\\D", "");
        }
        return value;
    }

    private record QueryParts(String whereSql, Map<String, Object> params) {
    }

}
