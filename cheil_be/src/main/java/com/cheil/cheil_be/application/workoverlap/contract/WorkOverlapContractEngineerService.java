package com.cheil.cheil_be.application.workoverlap.contract;

import com.cheil.cheil_be.adapter.in.web.workoverlap.contract.WorkOverlapContractEngineerChangeRequest;
import com.cheil.cheil_be.adapter.in.web.workoverlap.contract.WorkOverlapContractEngineerRequest;
import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineer;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerCandidate;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerHistory;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerSaveCommand;
import com.cheil.cheil_be.application.workoverlap.contract.port.out.WorkOverlapContractEngineerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkOverlapContractEngineerService {

    private final WorkOverlapContractEngineerRepository repository;
    private final CurrentActorPort currentActorPort;

    @Transactional(readOnly = true)
    public List<WorkOverlapContractEngineerCandidate> findEngineerCandidates(
            String keyword,
            Integer limit
    ) {
        int pageSize = limit == null ? 30 : Math.max(1, Math.min(limit, 100));
        return repository.findCandidates(normalize(keyword), pageSize);
    }

    @Transactional(readOnly = true)
    public List<WorkOverlapContractEngineer> findByContractNo(String contractNo) {
        return repository.findByContractNo(required(contractNo, "contractNo"));
    }

    @Transactional(readOnly = true)
    public List<WorkOverlapContractEngineerHistory> findHistoriesByContractNo(String contractNo) {
        return repository.findHistoriesByContractNo(required(contractNo, "contractNo"));
    }

    @Transactional
    public void deleteHistory(String contractNo, long historyId) {
        String normalizedContractNo = required(contractNo, "contractNo");
        if (!repository.deleteHistory(normalizedContractNo, historyId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "변경 이력을 찾을 수 없습니다.");
        }
    }

    @Transactional
    public WorkOverlapContractEngineer create(
            String contractNo,
            WorkOverlapContractEngineerRequest request
    ) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }

        String normalizedContractNo = required(contractNo, "contractNo");
        String engineerId = required(request.engineerId(), "engineerId");
        repository.create(new WorkOverlapContractEngineerSaveCommand(
                normalizedContractNo,
                null,
                engineerId,
                normalize(request.field()),
                normalizeDate(request.participationDate()),
                normalize(request.participationType()),
                Boolean.TRUE.equals(request.pqTargetYn()),
                normalize(request.remark()),
                currentActorPort.currentActor()
        ));
        return findByEngineerId(normalizedContractNo, engineerId);
    }

    @Transactional
    public WorkOverlapContractEngineer update(
            String contractNo,
            String engineerId,
            WorkOverlapContractEngineerChangeRequest request
    ) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }

        String normalizedContractNo = required(contractNo, "contractNo");
        String normalizedEngineerId = required(engineerId, "engineerId");
        String beforeEngineerId = required(request.beforeEngineerId(), "beforeEngineerId");
        String afterEngineerId = required(request.afterEngineerId(), "afterEngineerId");
        String changeContent = required(request.changeContent(), "changeContent");
        String actor = currentActorPort.currentActor();

        boolean updated = repository.update(new WorkOverlapContractEngineerSaveCommand(
                normalizedContractNo,
                normalizedEngineerId,
                afterEngineerId,
                normalize(request.field()),
                normalizeDate(request.participationDate()),
                normalize(request.participationType()),
                Boolean.TRUE.equals(request.pqTargetYn()),
                normalize(request.remark()),
                actor
        ));
        if (!updated) {
            throw engineerNotFound();
        }

        if (!beforeEngineerId.equals(afterEngineerId)) {
            repository.createHistory(
                    normalizedContractNo,
                    beforeEngineerId,
                    afterEngineerId,
                    changeContent,
                    actor
            );
        }
        return findByEngineerId(normalizedContractNo, afterEngineerId);
    }

    @Transactional
    public void delete(String contractNo, String engineerId) {
        String normalizedContractNo = required(contractNo, "contractNo");
        String normalizedEngineerId = required(engineerId, "engineerId");
        findByEngineerId(normalizedContractNo, normalizedEngineerId);
        if (!repository.delete(normalizedContractNo, normalizedEngineerId)) {
            throw engineerNotFound();
        }
    }

    private WorkOverlapContractEngineer findByEngineerId(String contractNo, String engineerId) {
        return repository.findByContractNo(contractNo).stream()
                .filter(engineer -> engineer.engineerId().equals(engineerId))
                .findFirst()
                .orElseThrow(this::engineerNotFound);
    }

    private ResponseStatusException engineerNotFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "참여 기술자 정보를 찾을 수 없습니다.");
    }

    private String required(String value, String fieldName) {
        String normalized = normalize(value);
        if (!StringUtils.hasText(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required.");
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
}
