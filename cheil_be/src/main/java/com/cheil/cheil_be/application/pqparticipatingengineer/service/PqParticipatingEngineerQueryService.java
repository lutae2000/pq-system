package com.cheil.cheil_be.application.pqparticipatingengineer.service;

import static com.cheil.cheil_be.application.common.exception.ApplicationException.badRequest;
import static com.cheil.cheil_be.application.common.exception.ApplicationException.notFound;
import static com.cheil.cheil_be.application.common.validation.InputValues.requiredPositive;
import static com.cheil.cheil_be.application.common.validation.InputValues.requiredText;
import static com.cheil.cheil_be.common.text.StringValues.trimToNull;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.cheil.cheil_be.adapter.in.web.pqparticipatingengineer.PqParticipatingEngineerRequest;
import com.cheil.cheil_be.adapter.in.web.pqparticipatingengineer.PqParticipatingEngineerResponse;
import com.cheil.cheil_be.adapter.in.web.pqparticipatingengineer.ReplacePqParticipatingEngineersRequest;
import com.cheil.cheil_be.application.engineer.EngineerDtos;
import com.cheil.cheil_be.application.engineer.port.in.EngineerAdminUseCase;
import com.cheil.cheil_be.common.security.AuditActorResolver;

/** PQ 공고에 선정된 기술인의 목록을 조회하고 변경하는 서비스. */
@Service
@RequiredArgsConstructor
public class PqParticipatingEngineerQueryService {

    private final JdbcClient jdbcClient;
    private final EngineerAdminUseCase engineerAdminService;

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
                                rs.getString("propart"),
                                null
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
        if (request == null) {
            throw badRequest("요청 본문이 필요합니다.");
        }
        Long bidSeq = requiredPositive(request.bidSeq(), "bidSeq");
        String workDutyId = requiredText(request.workDutyId(), "workDutyId");
        String engrId = requiredText(request.engrId(), "engrId");
        upsert(bidSeq, workDutyId, engrId, request.priority(), request.responsibility());
        return findSelectedOne(bidSeq, workDutyId, engrId);
    }

    @Transactional
    public PqParticipatingEngineerResponse update(Long bidSeq, String workDutyId, String engrId, PqParticipatingEngineerRequest request) {
        if (request == null) {
            throw badRequest("요청 본문이 필요합니다.");
        }
        Long targetBidSeq = requiredPositive(bidSeq, "bidSeq");
        String targetWorkDutyId = requiredText(workDutyId, "workDutyId");
        String targetEngrId = requiredText(engrId, "engrId");
        validateUpdateIdentity(targetBidSeq, targetWorkDutyId, targetEngrId, request);

        int updated = jdbcClient.sql("""
                        UPDATE pq_find_engr_info
                        SET priority = :priority,
                            responsibility = :responsibility,
                            created_id = COALESCE(created_id, :actor),
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = :actor
                        WHERE bid_seq = :bidSeq AND work_duty_id = :workDutyId AND engr_id = :engrId
                        """)
                .param("bidSeq", targetBidSeq)
                .param("workDutyId", targetWorkDutyId)
                .param("engrId", targetEngrId)
                .param("priority", request.priority())
                .param("responsibility", trimToNull(request.responsibility()))
                .param("actor", AuditActorResolver.resolve())
                .update();
        if (updated != 1) {
            throw notFound("PQ참여 기술자 정보를 찾을 수 없습니다.");
        }
        return findSelectedOne(targetBidSeq, targetWorkDutyId, targetEngrId);
    }

    @Transactional
    public void delete(Long bidSeq, String workDutyId, String engrId) {
        int deleted = jdbcClient.sql("""
                        DELETE FROM pq_find_engr_info
                        WHERE bid_seq = :bidSeq AND work_duty_id = :workDutyId AND engr_id = :engrId
                        """)
                .param("bidSeq", requiredPositive(bidSeq, "bidSeq"))
                .param("workDutyId", requiredText(workDutyId, "workDutyId"))
                .param("engrId", requiredText(engrId, "engrId"))
                .update();
        if (deleted != 1) {
            throw notFound("PQ참여 기술자 정보를 찾을 수 없습니다.");
        }
    }

    @Transactional
    public List<PqParticipatingEngineerResponse> replace(ReplacePqParticipatingEngineersRequest request) {
        // 기존 선택 목록을 같은 공고·업무 기준으로 통째로 교체합니다.
        // 이 메서드는 삭제와 재등록이 하나의 트랜잭션으로 묶여 부분 교체가 남지 않도록 합니다.
        if (request == null) {
            throw badRequest("요청 본문이 필요합니다.");
        }
        Long bidSeq = requiredPositive(request.bidSeq(), "bidSeq");
        String workDutyId = requiredText(request.workDutyId(), "workDutyId");

        jdbcClient.sql("DELETE FROM pq_find_engr_info WHERE bid_seq = :bidSeq AND work_duty_id = :workDutyId")
                .param("bidSeq", bidSeq)
                .param("workDutyId", workDutyId)
                .update();

        Set<String> engineerIds = new LinkedHashSet<>();
        if (request.engineers() != null) {
            request.engineers().stream()
                    .filter(item -> StringUtils.hasText(item.engrId()))
                    .forEach(item -> {
                        String engineerId = trimToNull(item.engrId());
                        if (engineerIds.add(engineerId)) {
                            upsert(bidSeq, workDutyId, engineerId, item.priority(), item.responsibility());
                        }
                    });
        }
        return findSelected(bidSeq, workDutyId);
    }

    private PqParticipatingEngineerResponse findSelectedOne(Long bidSeq, String workDutyId, String engrId) {
        return findSelected(bidSeq, workDutyId).stream()
                .filter(row -> row.engrId().equals(engrId))
                .findFirst()
                .orElseThrow(() -> notFound("PQ참여 기술자 정보를 찾을 수 없습니다."));
    }

    private void upsert(Long bidSeq, String workDutyId, String engrId) {
        upsert(bidSeq, workDutyId, engrId, null, null);
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
                .param("responsibility", trimToNull(responsibility))
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

    private void validateUpdateIdentity(Long bidSeq, String workDutyId, String engrId, PqParticipatingEngineerRequest request) {
        // 수정 대상의 식별자는 URL path가 소유합니다. body가 다른 대상을 가리키면 조용히 무시하지 않고 요청 오류로 처리합니다.
        if (request.bidSeq() != null && !bidSeq.equals(request.bidSeq())) {
            throw badRequest("path bidSeq와 body bidSeq가 일치해야 합니다.");
        }
        if (StringUtils.hasText(request.workDutyId()) && !workDutyId.equals(request.workDutyId().trim())) {
            throw badRequest("path workDutyId와 body workDutyId가 일치해야 합니다.");
        }
        if (StringUtils.hasText(request.engrId()) && !engrId.equals(request.engrId().trim())) {
            throw badRequest("path engrId와 body engrId가 일치해야 합니다.");
        }
    }


}
