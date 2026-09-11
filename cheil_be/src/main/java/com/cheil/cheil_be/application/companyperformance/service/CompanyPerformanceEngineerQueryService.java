package com.cheil.cheil_be.application.companyperformance.service;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceEngineerCandidateResponse;
import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceEngineerRequest;
import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceEngineerResponse;
import com.cheil.cheil_be.application.engineer.EngineerMasterRepository;

/** 회사실적에 참여한 기술인과 후보 기술인을 조회하고 관리하는 서비스. */
@Service
@RequiredArgsConstructor
public class CompanyPerformanceEngineerQueryService {

    private final EngineerMasterRepository engineerMasterRepository;
    private final JdbcClient jdbcClient;

    @Transactional(readOnly = true)
    public List<CompanyPerformanceEngineerCandidateResponse> findEngineerCandidates(String keyword, Integer limit) {
        int pageSize = limit == null ? 30 : Math.max(1, Math.min(limit, 100));
        String searchKeyword = StringUtils.hasText(keyword) ? keyword.trim() : "";
        return engineerMasterRepository.findCompanyPerformanceCandidates(searchKeyword, PageRequest.of(0, pageSize)).stream()
                .map(engineer -> new CompanyPerformanceEngineerCandidateResponse(
                        engineer.engineerId(),
                        engineer.name(),
                        engineer.department(),
                        engineer.position(),
                        engineer.dutyPart(),
                        engineer.proPart(),
                        engineer.designGrade()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CompanyPerformanceEngineerResponse> findByPerformanceSeq(Long seq) {
        if (seq == null) {
            return List.of();
        }

        return jdbcClient.sql("""
                        SELECT
                            h.id,
                            h.engr_id,
                            m.namekor,
                            h.startdt,
                            h.enddt,
                            h.jobclass,
                            h.jobtag,
                            h.joinyn,
                            h.returnyn,
                            h.englevel,
                            h.compname,
                            h.deptname,
                            h.grade,
                            h.duty,
                            h.jobpart,
                            h.propart,
                            h.remark
                        FROM pq_engineer_project_history h
                        LEFT JOIN pq_engineer_master m ON m.engr_id = h.engr_id
                        WHERE h.seq = :seq
                        ORDER BY h.startdt NULLS LAST, m.namekor NULLS LAST, h.id
                        """)
                .param("seq", seq.intValue())
                .query((rs, rowNum) -> new CompanyPerformanceEngineerResponse(
                        rs.getLong("id"),
                        rs.getString("engr_id"),
                        rs.getString("namekor"),
                        rs.getString("startdt"),
                        rs.getString("enddt"),
                        rs.getString("jobtag"),
                        rs.getString("jobclass"),
                        rs.getString("joinyn"),
                        rs.getString("returnyn"),
                        rs.getString("englevel"),
                        rs.getString("compname"),
                        rs.getString("deptname"),
                        rs.getString("grade"),
                        rs.getString("duty"),
                        rs.getString("jobpart"),
                        rs.getString("propart"),
                        rs.getString("remark")
                ))
                .list();
    }

    @Transactional
    public CompanyPerformanceEngineerResponse create(Long seq, CompanyPerformanceEngineerRequest request) {
        String engineerId = required(request.engineerId(), "engineerId");
        int updated = jdbcClient.sql("""
                        INSERT INTO pq_engineer_project_history (
                            engr_id, seq, startdt, enddt, jobclass, jobtag, joinyn, returnyn,
                            englevel, compname, deptname, grade, duty, jobpart, propart, remark
                        )
                        VALUES (
                            :engineerId, :seq, :startDt, :endDt, :jobClass, :jobTag, :joinYn, :returnYn,
                            :engLevel, :compName, :deptName, :grade, :duty, :jobPart, :proPart, :remark
                        )
                        """)
                .param("engineerId", engineerId)
                .param("seq", seq.intValue())
                .param("startDt", normalizeDate(request.participationStartDate()))
                .param("endDt", normalizeDate(request.participationEndDate()))
                .param("jobClass", normalize(request.participationFieldPosition()))
                .param("jobTag", normalize(request.category()))
                .param("joinYn", normalizeYn(request.actualParticipationYn()))
                .param("returnYn", normalizeYn(request.reportYn()))
                .param("engLevel", request.participationGrade())
                .param("compName", normalize(request.companyAtParticipation()))
                .param("deptName", normalize(request.departmentAtParticipation()))
                .param("grade", normalize(request.positionAtParticipation()))
                .param("duty", normalize(request.duty()))
                .param("jobPart", normalize(request.jobField()))
                .param("proPart", normalize(request.specialtyField()))
                .param("remark", normalize(request.remark()))
                .update();
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "참여기술자를 저장하지 못했습니다.");
        }
        return findLatestByPerformanceSeqAndEngineerId(seq, engineerId);
    }

    @Transactional
    public CompanyPerformanceEngineerResponse update(Long seq, Long id, CompanyPerformanceEngineerRequest request) {
        String engineerId = required(request.engineerId(), "engineerId");
        int updated = jdbcClient.sql("""
                        UPDATE pq_engineer_project_history
                        SET engr_id = :engineerId,
                            startdt = :startDt,
                            enddt = :endDt,
                            jobclass = :jobClass,
                            jobtag = :jobTag,
                            joinyn = :joinYn,
                            returnyn = :returnYn,
                            englevel = :engLevel,
                            compname = :compName,
                            deptname = :deptName,
                            grade = :grade,
                            duty = :duty,
                            jobpart = :jobPart,
                            propart = :proPart,
                            remark = :remark,
                            last_changed_at = CURRENT_TIMESTAMP
                        WHERE id = :id AND seq = :seq
                        """)
                .param("id", id)
                .param("seq", seq.intValue())
                .param("engineerId", engineerId)
                .param("startDt", normalizeDate(request.participationStartDate()))
                .param("endDt", normalizeDate(request.participationEndDate()))
                .param("jobClass", normalize(request.participationFieldPosition()))
                .param("jobTag", normalize(request.category()))
                .param("joinYn", normalizeYn(request.actualParticipationYn()))
                .param("returnYn", normalizeYn(request.reportYn()))
                .param("engLevel", request.participationGrade())
                .param("compName", normalize(request.companyAtParticipation()))
                .param("deptName", normalize(request.departmentAtParticipation()))
                .param("grade", normalize(request.positionAtParticipation()))
                .param("duty", normalize(request.duty()))
                .param("jobPart", normalize(request.jobField()))
                .param("proPart", normalize(request.specialtyField()))
                .param("remark", normalize(request.remark()))
                .update();
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "참여기술자 정보를 찾을 수 없습니다.");
        }
        return findById(seq, id);
    }

    @Transactional
    public void delete(Long seq, Long id) {
        int updated = jdbcClient.sql("DELETE FROM pq_engineer_project_history WHERE id = :id AND seq = :seq")
                .param("id", id)
                .param("seq", seq.intValue())
                .update();
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "참여기술자 정보를 찾을 수 없습니다.");
        }
    }

    private CompanyPerformanceEngineerResponse findLatestByPerformanceSeqAndEngineerId(Long seq, String engineerId) {
        return jdbcClient.sql("""
                        SELECT id
                        FROM pq_engineer_project_history
                        WHERE seq = :seq AND engr_id = :engineerId
                        ORDER BY id DESC
                        LIMIT 1
                        """)
                .param("seq", seq.intValue())
                .param("engineerId", engineerId)
                .query(Long.class)
                .optional()
                .map(id -> findById(seq, id))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "참여기술자 정보를 찾을 수 없습니다."));
    }

    private CompanyPerformanceEngineerResponse findById(Long seq, Long id) {
        return findByPerformanceSeq(seq).stream()
                .filter(row -> row.id().equals(id))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "참여기술자 정보를 찾을 수 없습니다."));
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

    private String normalizeYn(String value) {
        String normalized = normalize(value);
        if (normalized == null) {
            return null;
        }
        return normalized.equalsIgnoreCase("Y") ? "Y" : "N";
    }
}
