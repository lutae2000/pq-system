package com.cheil.cheil_be.application.workoverlap.contract;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.workoverlap.contract.WorkOverlapContractEngineerCandidateResponse;
import com.cheil.cheil_be.adapter.in.web.workoverlap.contract.WorkOverlapContractEngineerChangeRequest;
import com.cheil.cheil_be.adapter.in.web.workoverlap.contract.WorkOverlapContractEngineerHistoryResponse;
import com.cheil.cheil_be.adapter.in.web.workoverlap.contract.WorkOverlapContractEngineerRequest;
import com.cheil.cheil_be.adapter.in.web.workoverlap.contract.WorkOverlapContractEngineerResponse;
import com.cheil.cheil_be.common.security.AuditActorResolver;

/** 업무중복도 계약에 참여하는 기술인과 경력 이력을 조회하고 관리하는 서비스. */
@Service
@RequiredArgsConstructor
public class WorkOverlapContractEngineerService {

    private final JdbcClient jdbcClient;

    @Transactional(readOnly = true)
    public List<WorkOverlapContractEngineerCandidateResponse> findEngineerCandidates(String keyword, Integer limit) {
        int pageSize = limit == null ? 30 : Math.max(1, Math.min(limit, 100));
        String searchKeyword = normalize(keyword);
        return jdbcClient.sql("""
                        SELECT engr_id, namekor, birthday, COALESCE(dutypart, propart) AS field
                        FROM pq_engineer_master
                        WHERE COALESCE(retireyn, 'N') <> 'Y'
                          AND (:keyword IS NULL
                               OR LOWER(engr_id) LIKE LOWER(CONCAT('%', :keyword, '%'))
                               OR LOWER(namekor) LIKE LOWER(CONCAT('%', :keyword, '%'))
                               OR LOWER(COALESCE(dutypart, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                               OR LOWER(COALESCE(propart, '')) LIKE LOWER(CONCAT('%', :keyword, '%')))
                        ORDER BY namekor, engr_id
                        LIMIT :limit
                        """)
                .param("keyword", searchKeyword)
                .param("limit", pageSize)
                .query((rs, rowNum) -> new WorkOverlapContractEngineerCandidateResponse(
                        rs.getString("engr_id"),
                        rs.getString("namekor"),
                        rs.getString("birthday"),
                        rs.getString("field")
                ))
                .list();
    }

    @Transactional(readOnly = true)
    public List<WorkOverlapContractEngineerResponse> findByContractNo(String contractNo) {
        return jdbcClient.sql("""
                        SELECT
                            e.engineer_id,
                            m.namekor,
                            m.birthday,
                            COALESCE(e.field, m.dutypart, m.propart) AS field,
                            e.participation_date,
                            e.participation_type,
                            e.pq_target_yn,
                            e.remark
                        FROM work_overlap_contract_engineers e
                        LEFT JOIN pq_engineer_master m ON m.engr_id = e.engineer_id
                        WHERE e.contract_no = :contractNo
                        ORDER BY e.participation_date NULLS LAST, m.namekor NULLS LAST, e.engineer_id
                        """)
                .param("contractNo", required(contractNo, "contractNo"))
                .query((rs, rowNum) -> new WorkOverlapContractEngineerResponse(
                        rs.getString("engineer_id"),
                        rs.getString("namekor"),
                        rs.getString("birthday"),
                        rs.getString("field"),
                        formatDate(rs.getString("participation_date")),
                        rs.getString("participation_type"),
                        rs.getBoolean("pq_target_yn"),
                        rs.getString("remark")
                ))
                .list();
    }

    @Transactional(readOnly = true)
    public List<WorkOverlapContractEngineerHistoryResponse> findHistoriesByContractNo(String contractNo) {
        return jdbcClient.sql("""
                        SELECT
                            h.id,
                            h.created_at,
                            h.before_engineer_id,
                            bm.namekor AS before_engineer_name,
                            h.after_engineer_id,
                            am.namekor AS after_engineer_name,
                            h.change_content
                        FROM work_overlap_contract_engineer_histories h
                        LEFT JOIN pq_engineer_master bm ON bm.engr_id = h.before_engineer_id
                        LEFT JOIN pq_engineer_master am ON am.engr_id = h.after_engineer_id
                        WHERE h.contract_no = :contractNo
                        ORDER BY h.created_at DESC, h.id DESC
                        """)
                .param("contractNo", required(contractNo, "contractNo"))
                .query((rs, rowNum) -> new WorkOverlapContractEngineerHistoryResponse(
                        rs.getLong("id"),
                        rs.getTimestamp("created_at") == null ? null : rs.getTimestamp("created_at").toInstant().toString(),
                        rs.getString("before_engineer_id"),
                        rs.getString("before_engineer_name"),
                        rs.getString("after_engineer_id"),
                        rs.getString("after_engineer_name"),
                        rs.getString("change_content")
                ))
                .list();
    }

    @Transactional
    public void deleteHistory(String contractNo, long historyId) {
        String normalizedContractNo = required(contractNo, "contractNo");
        int deleted = jdbcClient.sql("""
                        DELETE FROM work_overlap_contract_engineer_histories
                        WHERE contract_no = :contractNo
                          AND id = :historyId
                        """)
                .param("contractNo", normalizedContractNo)
                .param("historyId", historyId)
                .update();
        if (deleted != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "변경이력을 찾을 수 없습니다.");
        }
    }

    @Transactional
    public WorkOverlapContractEngineerResponse create(String contractNo, WorkOverlapContractEngineerRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }
        String normalizedContractNo = required(contractNo, "contractNo");
        String engineerId = required(request.engineerId(), "engineerId");
        String actor = AuditActorResolver.resolve();
        jdbcClient.sql("""
                        INSERT INTO work_overlap_contract_engineers (
                            contract_no, engineer_id, field, participation_date, participation_type, pq_target_yn, remark, created_id, last_changed_id
                        )
                        VALUES (:contractNo, :engineerId, :field, :participationDate, :participationType, :pqTargetYn, :remark, :actor, :actor)
                        """)
                .param("contractNo", normalizedContractNo)
                .param("engineerId", engineerId)
                .param("field", normalize(request.field()))
                .param("participationDate", normalizeDate(request.participationDate()))
                .param("participationType", normalize(request.participationType()))
                .param("pqTargetYn", Boolean.TRUE.equals(request.pqTargetYn()))
                .param("remark", normalize(request.remark()))
                .param("actor", actor)
                .update();
        return findByEngineerId(normalizedContractNo, engineerId);
    }

    @Transactional
    public WorkOverlapContractEngineerResponse update(String contractNo, String engineerId, WorkOverlapContractEngineerChangeRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }
        String normalizedContractNo = required(contractNo, "contractNo");
        String normalizedEngineerId = required(engineerId, "engineerId");
        String beforeEngineerId = required(request.beforeEngineerId(), "beforeEngineerId");
        String afterEngineerId = required(request.afterEngineerId(), "afterEngineerId");
        String changeContent = required(request.changeContent(), "changeContent");
        String actor = AuditActorResolver.resolve();
        int updated = jdbcClient.sql("""
                        UPDATE work_overlap_contract_engineers
                        SET engineer_id = :afterEngineerId,
                            field = :field,
                            participation_date = :participationDate,
                            participation_type = :participationType,
                            pq_target_yn = :pqTargetYn,
                            remark = :remark,
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = :actor
                        WHERE contract_no = :contractNo AND engineer_id = :engineerId
                        """)
                .param("contractNo", normalizedContractNo)
                .param("engineerId", normalizedEngineerId)
                .param("afterEngineerId", afterEngineerId)
                .param("field", normalize(request.field()))
                .param("participationDate", normalizeDate(request.participationDate()))
                .param("participationType", normalize(request.participationType()))
                .param("pqTargetYn", Boolean.TRUE.equals(request.pqTargetYn()))
                .param("remark", normalize(request.remark()))
                .param("actor", actor)
                .update();
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "참여기술자 정보를 찾을 수 없습니다.");
        }
        if (!beforeEngineerId.equals(afterEngineerId)) {
            insertHistory(normalizedContractNo, beforeEngineerId, afterEngineerId, changeContent);
        }
        return findByEngineerId(normalizedContractNo, afterEngineerId);
    }

    @Transactional
    public void delete(String contractNo, String engineerId) {
        String normalizedContractNo = required(contractNo, "contractNo");
        String normalizedEngineerId = required(engineerId, "engineerId");
        WorkOverlapContractEngineerResponse target = findByEngineerId(normalizedContractNo, normalizedEngineerId);
        int deleted = jdbcClient.sql("DELETE FROM work_overlap_contract_engineers WHERE contract_no = :contractNo AND engineer_id = :engineerId")
                .param("contractNo", normalizedContractNo)
                .param("engineerId", normalizedEngineerId)
                .update();
        if (deleted != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "참여기술자 정보를 찾을 수 없습니다.");
        }
    }

    private WorkOverlapContractEngineerResponse findByEngineerId(String contractNo, String engineerId) {
        return findByContractNo(contractNo).stream()
                .filter(row -> row.engineerId().equals(engineerId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "참여기술자 정보를 찾을 수 없습니다."));
    }

    private void insertHistory(String contractNo, String beforeEngineerId, String afterEngineerId, String changeContent) {
        String actor = AuditActorResolver.resolve();
        jdbcClient.sql("""
                        INSERT INTO work_overlap_contract_engineer_histories (
                            contract_no, before_engineer_id, after_engineer_id, change_content, created_id, last_changed_id
                        )
                        VALUES (:contractNo, :beforeEngineerId, :afterEngineerId, :changeContent, :actor, :actor)
                        """)
                .param("contractNo", contractNo)
                .param("beforeEngineerId", normalize(beforeEngineerId))
                .param("afterEngineerId", normalize(afterEngineerId))
                .param("changeContent", required(changeContent, "changeContent"))
                .param("actor", actor)
                .update();
    }

    private String required(String value, String fieldName) {
        String normalized = normalize(value);
        if (!StringUtils.hasText(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + "은 필수입니다.");
        }
        return normalized;
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String normalizeDate(String value) {
        String normalized = normalize(value);
        return normalized == null ? null : normalized.replaceAll("\\D", "");
    }

    private String formatDate(String value) {
        String normalized = normalizeDate(value);
        if (normalized == null || normalized.length() != 8) {
            return normalized;
        }
        return normalized.substring(0, 4) + "-" + normalized.substring(4, 6) + "-" + normalized.substring(6, 8);
    }
}
