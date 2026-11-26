package com.cheil.cheil_be.adapter.out.persistence.pqparticipatingengineer;

import static com.cheil.cheil_be.adapter.out.persistence.relatedprojecthistory.ProjectHistoryJdbcPredicate.addEquals;
import static com.cheil.cheil_be.common.text.StringValues.normalize;
import static com.cheil.cheil_be.common.text.StringValues.trimToNull;

import com.cheil.cheil_be.adapter.out.persistence.relatedprojecthistory.ProjectHistoryJdbcPredicate;
import com.cheil.cheil_be.application.pqparticipatingengineer.model.CandidateEngineer;
import com.cheil.cheil_be.application.pqparticipatingengineer.model.CandidateEngineerFilters;
import com.cheil.cheil_be.application.pqparticipatingengineer.port.out.CandidateEngineerRepository;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryCondition;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionMetadata;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.support.SqlArrayValue;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

@Repository
@RequiredArgsConstructor
public class CandidateEngineerJdbcRepository implements CandidateEngineerRepository {

    private final JdbcClient jdbcClient;

    @Override
    public Page<CandidateEngineer> findCandidates(
            CandidateEngineerFilters filters,
            List<ProjectHistoryCondition> conditions,
            Map<String, ProjectHistoryConditionMetadata> metadata,
            Pageable pageable
    ) {
        QueryParts queryParts = buildCandidateWhere(filters, conditions, metadata);

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

        List<CandidateEngineer> rows = jdbcClient.sql(selectSql)
                .params(selectParams)
                .query((rs, rowNum) -> new CandidateEngineer(
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

    private QueryParts buildCandidateWhere(
            CandidateEngineerFilters filters,
            List<ProjectHistoryCondition> projectHistoryConditions,
            Map<String, ProjectHistoryConditionMetadata> conditionMetadata
    ) {
        List<String> conditions = new ArrayList<>();
        Map<String, Object> params = new LinkedHashMap<>();

        if (StringUtils.hasText(filters.keyword())) {
            conditions.add("""
                    (
                        LOWER(m.namekor) LIKE :keyword
                        OR LOWER(m.deptname) LIKE :keyword
                        OR LOWER(m.grade) LIKE :keyword
                        OR LOWER(m.dutypart) LIKE :keyword
                        OR LOWER(m.propart) LIKE :keyword
                    )
                    """);
            params.put("keyword", "%" + filters.keyword().trim().toLowerCase(Locale.ROOT) + "%");
        }
        addEquals(conditions, params, "m.retireyn", "retireYn", filters.retireYn());
        addEquals(conditions, params, "m.construction_management_grade", "constructionManagementGrade", filters.constructionManagementGrade());
        addEquals(conditions, params, "m.design_grade", "designGrade", filters.designGrade());
        addEquals(conditions, params, "m.dutypart", "jobField", filters.jobField());
        addEquals(conditions, params, "m.propart", "specialtyField", filters.specialtyField());

        if (StringUtils.hasText(filters.certificationName())) {
            conditions.add("""
                    m.engr_id IN (
                        SELECT l.engr_id
                        FROM pq_engineer_license l
                        WHERE LOWER(l.license_code) LIKE :certificationName
                    )
                    """);
            params.put("certificationName", "%" + filters.certificationName().trim().toLowerCase(Locale.ROOT) + "%");
        }

        if (filters.bidSeq() != null) {
            String workDuty = trimToNull(filters.workDutyId());
            String workDutyPredicate = "";
            if (workDuty != null) {
                workDutyPredicate = "AND s.work_duty_id = :excludeWorkDutyId";
                params.put("excludeWorkDutyId", workDuty);
            }
            conditions.add("""
                    NOT EXISTS (
                        SELECT 1
                        FROM pq_find_engr_info s
                        WHERE s.bid_seq = :excludeBidSeq
                          AND s.engr_id = m.engr_id
                          %s
                    )
                    """.formatted(workDutyPredicate));
            params.put("excludeBidSeq", filters.bidSeq());
        }

        if (!filters.draftEngineerIds().isEmpty()) {
            conditions.add("m.engr_id <> ALL (:draftEngineerIds)");
            params.put("draftEngineerIds", new SqlArrayValue("varchar", filters.draftEngineerIds().toArray()));
        }

        String historySql = ProjectHistoryJdbcPredicate.build(projectHistoryConditions, params, conditionMetadata);
        if (StringUtils.hasText(historySql)) {
            conditions.add("""
                    EXISTS (
                        SELECT 1
                        FROM pq_engineer_project_history h
                        WHERE h.engr_id = m.engr_id
                          AND (%s)
                    )
                    """.formatted(historySql));
        }

        if (conditions.isEmpty()) {
            return new QueryParts("", params);
        }
        return new QueryParts("WHERE " + String.join("\nAND ", conditions), params);
    }

    private record QueryParts(String whereSql, Map<String, Object> params) {
    }
}
