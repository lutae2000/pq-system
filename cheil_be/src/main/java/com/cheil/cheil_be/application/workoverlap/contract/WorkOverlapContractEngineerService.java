package com.cheil.cheil_be.application.workoverlap.contract;

import com.cheil.cheil_be.application.common.validation.InputValues;

import static com.cheil.cheil_be.application.common.validation.InputValues.requiredText;
import static com.cheil.cheil_be.common.text.StringValues.trimToNull;

import com.cheil.cheil_be.adapter.in.web.workoverlap.contract.WorkOverlapContractEngineerChangeRequest;
import com.cheil.cheil_be.adapter.in.web.workoverlap.contract.WorkOverlapContractEngineerRequest;
import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineer;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerCandidate;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerHistory;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerSaveCommand;
import com.cheil.cheil_be.application.workoverlap.contract.port.out.WorkOverlapContractEngineerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import com.cheil.cheil_be.application.common.exception.ApplicationException;

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
        return repository.findCandidates(trimToNull(keyword), pageSize);
    }

    @Transactional(readOnly = true)
    public List<WorkOverlapContractEngineer> findByContractNo(String contractNo) {
        return repository.findByContractNo(requiredText(contractNo, "contractNo"));
    }

    @Transactional(readOnly = true)
    public List<WorkOverlapContractEngineerHistory> findHistoriesByContractNo(String contractNo) {
        return repository.findHistoriesByContractNo(requiredText(contractNo, "contractNo"));
    }

    @Transactional
    public void deleteHistory(String contractNo, long historyId) {
        String normalizedContractNo = requiredText(contractNo, "contractNo");
        if (!repository.deleteHistory(normalizedContractNo, historyId)) {
            throw ApplicationException.notFound("변경 이력을 찾을 수 없습니다.");
        }
    }

    @Transactional
    public WorkOverlapContractEngineer create(
            String contractNo,
            WorkOverlapContractEngineerRequest request
    ) {
        if (request == null) {
            throw ApplicationException.badRequest("Request body is required.");
        }

        String normalizedContractNo = requiredText(contractNo, "contractNo");
        String engineerId = requiredText(request.engineerId(), "engineerId");
        repository.create(new WorkOverlapContractEngineerSaveCommand(
                normalizedContractNo,
                null,
                engineerId,
                trimToNull(request.field()),
                normalizeDate(request.participationDate()),
                trimToNull(request.participationType()),
                Boolean.TRUE.equals(request.pqTargetYn()),
                trimToNull(request.remark()),
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
            throw ApplicationException.badRequest("Request body is required.");
        }

        String normalizedContractNo = requiredText(contractNo, "contractNo");
        String normalizedEngineerId = requiredText(engineerId, "engineerId");
        String beforeEngineerId = requiredText(request.beforeEngineerId(), "beforeEngineerId");
        String afterEngineerId = requiredText(request.afterEngineerId(), "afterEngineerId");
        String changeContent = requiredText(request.changeContent(), "changeContent");
        String actor = currentActorPort.currentActor();

        boolean updated = repository.update(new WorkOverlapContractEngineerSaveCommand(
                normalizedContractNo,
                normalizedEngineerId,
                afterEngineerId,
                trimToNull(request.field()),
                normalizeDate(request.participationDate()),
                trimToNull(request.participationType()),
                Boolean.TRUE.equals(request.pqTargetYn()),
                trimToNull(request.remark()),
                actor
        ));
        if (!updated) {
            throw ApplicationException.notFound("참여 기술자 정보를 찾을 수 없습니다.");
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
        String normalizedContractNo = requiredText(contractNo, "contractNo");
        String normalizedEngineerId = requiredText(engineerId, "engineerId");
        findByEngineerId(normalizedContractNo, normalizedEngineerId);
        if (!repository.delete(normalizedContractNo, normalizedEngineerId)) {
            throw ApplicationException.notFound("참여 기술자 정보를 찾을 수 없습니다.");
        }
    }

    private WorkOverlapContractEngineer findByEngineerId(String contractNo, String engineerId) {
        return repository.findByContractNo(contractNo).stream()
                .filter(engineer -> engineer.engineerId().equals(engineerId))
                .findFirst()
                .orElseThrow(() -> ApplicationException.notFound("참여 기술자 정보를 찾을 수 없습니다."));
    }

    private String normalizeDate(String value) {
        String normalized = trimToNull(value);
        return normalized == null ? null : normalized.replaceAll("\\D", "");
    }
}
