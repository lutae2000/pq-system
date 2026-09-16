package com.cheil.cheil_be.application.educationreminder.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.educationreminder.model.EducationReminderAssignedEngineer;
import com.cheil.cheil_be.application.educationreminder.port.out.EducationReminderEngineerAssignmentRepository;
import com.cheil.cheil_be.application.engineer.port.out.EngineerMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderBasicInfoEngineerAssignRequest;
import com.cheil.cheil_be.adapter.out.persistence.educationreminder.EducationReminderBasicInfoJpaRepository;

/** 교육 알림 기초정보에 기술인을 배정하거나 배정 목록을 조회하는 서비스. */
@Service
@RequiredArgsConstructor
public class EducationReminderBasicInfoEngineerService {

    private final EducationReminderBasicInfoJpaRepository basicInfoRepository;
    private final EngineerMasterRepository engineerMasterRepository;
    private final EducationReminderEngineerAssignmentRepository assignmentRepository;
    private final CurrentActorPort currentActorPort;

    @Transactional(readOnly = true)
    public List<EducationReminderAssignedEngineer> findAssignedEngineers(String basicInfoCode) {
        String normalizedBasicInfoCode = requiredBasicInfoCode(basicInfoCode);
        ensureBasicInfoExists(normalizedBasicInfoCode);
        return assignmentRepository.findByBasicInfoCode(normalizedBasicInfoCode);
    }

    @Transactional
    public List<EducationReminderAssignedEngineer> addAssignments(
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

        String actor = currentActorPort.currentActor();
        for (String engineerId : engineerIds) {
            assignmentRepository.save(
                    normalizedBasicInfoCode,
                    engineerId,
                    actor
            );
        }

        return findAssignedEngineers(normalizedBasicInfoCode);
    }

    @Transactional
    public void deleteAssignment(String basicInfoCode, String engineerId) {
        String normalizedBasicInfoCode = requiredBasicInfoCode(basicInfoCode);
        ensureBasicInfoExists(normalizedBasicInfoCode);

        String normalizedEngineerId = requiredEngineerId(engineerId);
        boolean deleted = assignmentRepository.delete(
                normalizedBasicInfoCode,
                normalizedEngineerId
        );
        if (!deleted) {
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
