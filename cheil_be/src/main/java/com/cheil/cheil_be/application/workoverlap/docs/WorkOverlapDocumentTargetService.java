package com.cheil.cheil_be.application.workoverlap.docs;

import static com.cheil.cheil_be.application.common.exception.ApplicationException.badRequest;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.workoverlap.docs.model.WorkOverlapDocumentTarget;
import com.cheil.cheil_be.application.workoverlap.docs.port.in.WorkOverlapDocumentTargetUseCase;
import com.cheil.cheil_be.application.workoverlap.docs.port.out.WorkOverlapDocumentTargetRepository;

@Service
@RequiredArgsConstructor
public class WorkOverlapDocumentTargetService implements WorkOverlapDocumentTargetUseCase {

    private final WorkOverlapDocumentTargetRepository targetRepository;

    @Transactional(readOnly = true)
    public List<WorkOverlapDocumentTarget> find(String workDutyId, Long bidSeq, String engineerId) {
        validateKey(workDutyId, bidSeq, engineerId);
        return targetRepository.find(workDutyId.trim(), bidSeq, engineerId.trim());
    }

    @Transactional
    public List<WorkOverlapDocumentTarget> replace(String workDutyId, Long bidSeq, String engineerId, List<WorkOverlapDocumentTarget> targets) {
        validateKey(workDutyId, bidSeq, engineerId);
        String normalizedWorkDutyId = workDutyId.trim();
        String normalizedEngineerId = engineerId.trim();

        // replace는 요청 목록을 최종 상태로 취급합니다.
        // 기존 행과 병합하면 화면에서 해제한 계약이 DB에 남아 문서 생성 대상에 다시 포함될 수 있습니다.
        List<WorkOverlapDocumentTarget> normalizedTargets = (targets == null ? List.<WorkOverlapDocumentTarget>of() : targets).stream()
                .filter(item -> item != null && item.contractNo() != null && !item.contractNo().isBlank())
                .map(item -> new WorkOverlapDocumentTarget(null,
                        bidSeq,
                        normalizedWorkDutyId,
                        normalizedEngineerId,
                        item.contractNo().trim(),
                        item.displayOrder(),
                        normalizeResponsibility(item.responsibility())
                ))
                .toList();

        return targetRepository.replace(normalizedWorkDutyId, bidSeq, normalizedEngineerId, normalizedTargets);
    }

    @Transactional
    public void delete(String workDutyId, Long bidSeq, String engineerId, String contractNo) {
        validateKey(workDutyId, bidSeq, engineerId);
        if (contractNo == null || contractNo.isBlank()) {
            throw badRequest("contractNo is required.");
        }
        targetRepository.delete(workDutyId.trim(), bidSeq, engineerId.trim(), contractNo.trim());
    }

    private void validateKey(String workDutyId, Long bidSeq, String engineerId) {
        if (workDutyId == null || workDutyId.isBlank() || bidSeq == null || engineerId == null || engineerId.isBlank()) {
            throw badRequest("공고와 기술인은 필수입니다.");
        }
    }

    private String normalizeResponsibility(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }
}
