package com.cheil.cheil_be.application.educationreminder.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderBasicInfoEngineerAssignRequest;
import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderBasicInfoEngineerResponse;
import com.cheil.cheil_be.adapter.out.persistence.educationreminder.EducationReminderBasicInfoJpaRepository;
import com.cheil.cheil_be.application.engineer.EngineerMasterRepository;
import com.cheil.cheil_be.common.crypto.Aes256CryptoService;
import com.cheil.cheil_be.common.security.AuditActorResolver;

@Service
@RequiredArgsConstructor
public class EducationReminderBasicInfoEngineerService {

    private final EducationReminderBasicInfoJpaRepository basicInfoRepository;
    private final EngineerMasterRepository engineerMasterRepository;
    private final JdbcClient jdbcClient;
    private final Aes256CryptoService aes256CryptoService;

    @Transactional(readOnly = true)
    public List<EducationReminderBasicInfoEngineerResponse> findAssignedEngineers(String basicInfoCode) {
        String normalizedBasicInfoCode = requiredBasicInfoCode(basicInfoCode);
        ensureBasicInfoExists(normalizedBasicInfoCode);

        return jdbcClient.sql("""
                        SELECT
                            a.basic_info_code,
                            a.engineer_id,
                            COALESCE(m.namekor, '') AS engineer_name,
                            COALESCE(m.deptname, '') AS department_name,
                            COALESCE(m.grade, '') AS grade,
                            COALESCE(m.dutypart, '') AS job_field,
                            COALESCE(m.propart, '') AS specialty_field,
                            COALESCE(m.retireyn, 'N') AS retire_yn,
                            p.phone_no,
                            a.created_at,
                            a.created_id,
                            a.last_changed_at,
                            a.last_changed_id
                        FROM education_reminder_basic_info_engineers a
                        LEFT JOIN pq_engineer_master m ON m.engr_id = a.engineer_id
                        LEFT JOIN engineer_contacts p ON p.engr_id = a.engineer_id
                        WHERE a.basic_info_code = :basicInfoCode
                        ORDER BY m.namekor NULLS LAST, a.engineer_id
                        """)
                .param("basicInfoCode", normalizedBasicInfoCode)
                .query((rs, rowNum) -> new EducationReminderBasicInfoEngineerResponse(
                        rs.getString("basic_info_code"),
                        rs.getString("engineer_id"),
                        rs.getString("engineer_name"),
                        rs.getString("department_name"),
                        rs.getString("grade"),
                        rs.getString("job_field"),
                        rs.getString("specialty_field"),
                        rs.getString("retire_yn"),
                        aes256CryptoService.decrypt(rs.getString("phone_no")),
                        rs.getString("created_at"),
                        rs.getString("created_id"),
                        rs.getString("last_changed_at"),
                        rs.getString("last_changed_id")
                ))
                .list();
    }

    @Transactional
    public List<EducationReminderBasicInfoEngineerResponse> addAssignments(
            String basicInfoCode,
            EducationReminderBasicInfoEngineerAssignRequest request
    ) {
        String normalizedBasicInfoCode = requiredBasicInfoCode(basicInfoCode);
        ensureBasicInfoExists(normalizedBasicInfoCode);

        List<String> engineerIds = normalizeEngineerIds(request == null ? null : request.engineerIds());
        if (engineerIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "engineerIds is required.");
        }

        for (String engineerId : engineerIds) {
            if (!engineerMasterRepository.existsById(engineerId)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "기술인을 찾을 수 없습니다: " + engineerId);
            }
        }

        String actor = AuditActorResolver.resolve();
        for (String engineerId : engineerIds) {
            if (!engineerMasterRepository.existsById(engineerId)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "기술인을 찾을 수 없습니다: " + engineerId);
            }

            jdbcClient.sql("""
                            INSERT INTO education_reminder_basic_info_engineers (
                                basic_info_code,
                                engineer_id,
                                created_id,
                                last_changed_id
                            )
                            VALUES (
                                :basicInfoCode,
                                :engineerId,
                                :actor,
                                :actor
                            )
                            ON CONFLICT (basic_info_code, engineer_id)
                            DO UPDATE SET
                                last_changed_at = CURRENT_TIMESTAMP,
                                last_changed_id = EXCLUDED.last_changed_id
                            """)
                    .param("basicInfoCode", normalizedBasicInfoCode)
                    .param("engineerId", engineerId)
                    .param("actor", actor)
                    .update();
        }

        return findAssignedEngineers(normalizedBasicInfoCode);
    }

    @Transactional
    public void deleteAssignment(String basicInfoCode, String engineerId) {
        String normalizedBasicInfoCode = requiredBasicInfoCode(basicInfoCode);
        ensureBasicInfoExists(normalizedBasicInfoCode);

        String normalizedEngineerId = requiredEngineerId(engineerId);
        int deleted = jdbcClient.sql("""
                        DELETE FROM education_reminder_basic_info_engineers
                        WHERE basic_info_code = :basicInfoCode
                          AND engineer_id = :engineerId
                        """)
                .param("basicInfoCode", normalizedBasicInfoCode)
                .param("engineerId", normalizedEngineerId)
                .update();
        if (deleted != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "할당된 기술인을 찾을 수 없습니다.");
        }
    }

    private List<String> normalizeEngineerIds(List<String> engineerIds) {
        if (engineerIds == null) {
            return List.of();
        }

        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        for (String engineerId : engineerIds) {
            String value = requiredEngineerId(engineerId);
            normalized.add(value);
        }
        return new ArrayList<>(normalized);
    }

    private void ensureBasicInfoExists(String basicInfoCode) {
        if (!basicInfoRepository.existsById(basicInfoCode)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "교육 알림 기초 정보를 찾을 수 없습니다.");
        }
    }

    private String requiredBasicInfoCode(String basicInfoCode) {
        if (!StringUtils.hasText(basicInfoCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "basicInfoCode is required.");
        }
        return basicInfoCode.trim();
    }

    private String requiredEngineerId(String engineerId) {
        String normalized = StringUtils.hasText(engineerId) ? engineerId.trim() : null;
        if (!StringUtils.hasText(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "engineerId is required.");
        }
        return normalized;
    }
}
