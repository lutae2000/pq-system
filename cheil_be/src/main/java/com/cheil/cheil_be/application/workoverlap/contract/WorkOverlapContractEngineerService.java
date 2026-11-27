package com.cheil.cheil_be.application.workoverlap.contract;

import static com.cheil.cheil_be.application.common.validation.InputValues.basicDate;
import static com.cheil.cheil_be.application.common.validation.InputValues.optionalText;
import static com.cheil.cheil_be.application.common.validation.InputValues.requiredText;
import static com.cheil.cheil_be.common.text.StringValues.trimToNull;

import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineer;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerCandidate;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerChangeCommand;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerCreateCommand;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerHistory;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerHistorySaveCommand;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerParticipation;
import com.cheil.cheil_be.application.workoverlap.contract.model.WorkOverlapContractEngineerSaveCommand;
import com.cheil.cheil_be.application.workoverlap.contract.port.in.WorkOverlapContractEngineerUseCase;
import com.cheil.cheil_be.application.workoverlap.contract.port.out.WorkOverlapContractEngineerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import com.cheil.cheil_be.application.common.exception.ApplicationException;

@Service
@RequiredArgsConstructor
public class WorkOverlapContractEngineerService implements WorkOverlapContractEngineerUseCase {

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
            WorkOverlapContractEngineerCreateCommand request
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
                basicDate(request.participationEndDate(), "참여종료일", false),
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
            WorkOverlapContractEngineerChangeCommand request
    ) {
        if (request == null) {
            throw ApplicationException.badRequest("Request body is required.");
        }

        String normalizedContractNo = requiredText(contractNo, "contractNo");
        String normalizedEngineerId = requiredText(engineerId, "engineerId");
        String beforeEngineerId = requiredText(request.beforeEngineerId(), "beforeEngineerId");
        String afterEngineerId = requiredText(request.afterEngineerId(), "afterEngineerId");
        if (!normalizedEngineerId.equals(beforeEngineerId)) {
            throw ApplicationException.badRequest("변경 전 기술인이 수정 대상과 일치하지 않습니다.");
        }
        String actor = currentActorPort.currentActor();
        var assignment = new WorkOverlapContractEngineerSaveCommand(
                normalizedContractNo,
                normalizedEngineerId,
                afterEngineerId,
                optionalText(request.field(), 100, "분야"),
                normalizeDate(request.participationDate()),
                basicDate(request.participationEndDate(), "참여종료일", false),
                optionalText(request.participationType(), 100, "참여구분"),
                Boolean.TRUE.equals(request.pqTargetYn()),
                trimToNull(request.remark()),
                actor
        );
        var history = beforeEngineerId.equals(afterEngineerId) ? null : new WorkOverlapContractEngineerHistorySaveCommand(
                normalizedContractNo,
                beforeEngineerId,
                afterEngineerId,
                requiredText(request.changeContent(), "changeContent"),
                new WorkOverlapContractEngineerParticipation(
                        optionalText(request.historyField(), 100, "변경 전 분야"),
                        optionalText(request.historyParticipationType(), 100, "변경 전 참여구분"),
                        basicDate(request.historyParticipationStartDate(), "변경 전 참여시작일", false),
                        basicDate(request.historyParticipationEndDate(), "변경 전 참여종료일", false)
                ),
                new WorkOverlapContractEngineerParticipation(
                        assignment.field(), assignment.participationType(),
                        assignment.participationDate(), assignment.participationEndDate()
                ),
                actor
        );

        boolean updated = repository.update(assignment);
        if (!updated) {
            throw ApplicationException.notFound("참여 기술자 정보를 찾을 수 없습니다.");
        }

        if (history != null) {
            repository.createHistory(history);
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
