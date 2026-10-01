package com.cheil.cheil_be.application.workoverlap.docs;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.adapter.in.web.workoverlap.docs.WorkOverlapDocumentTargetItem;
import com.cheil.cheil_be.adapter.in.web.workoverlap.docs.WorkOverlapDocumentTargetRequest;
import com.cheil.cheil_be.adapter.in.web.workoverlap.docs.WorkOverlapDocumentTargetResponse;
import com.cheil.cheil_be.adapter.out.persistence.workoverlap.docs.WorkOverlapDocumentTargetEntity;
import com.cheil.cheil_be.adapter.out.persistence.workoverlap.docs.WorkOverlapDocumentTargetJpaRepository;
import com.cheil.cheil_be.application.workoverlap.exception.WorkOverlapApplicationException;

@Service
@RequiredArgsConstructor
public class WorkOverlapDocumentTargetService {

    private final WorkOverlapDocumentTargetJpaRepository targetRepository;

    @Transactional(readOnly = true)
    public List<WorkOverlapDocumentTargetResponse> findByWorkDutyIdAndBidSeqAndEngineerId(String workDutyId, Long bidSeq, String engineerId) {
        validateKey(workDutyId, bidSeq, engineerId);
        return targetRepository.findByWorkDutyIdAndBidSeqAndEngineerIdOrderByDisplayOrderAscTargetIdAsc(workDutyId.trim(), bidSeq, engineerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public List<WorkOverlapDocumentTargetResponse> replace(WorkOverlapDocumentTargetRequest request) {
        validateKey(request == null ? null : request.workDutyId(), request == null ? null : request.bidSeq(), request == null ? null : request.engineerId());
        List<WorkOverlapDocumentTargetItem> items = request.contracts() == null ? List.of() : request.contracts();
        String normalizedWorkDutyId = request.workDutyId().trim();
        String normalizedEngineerId = request.engineerId().trim();

        // replace는 요청 목록을 최종 상태로 취급합니다.
        // 기존 행과 병합하면 화면에서 해제한 계약이 DB에 남아 문서 생성 대상에 다시 포함될 수 있습니다.
        targetRepository.deleteByWorkDutyIdAndBidSeqAndEngineerId(
                normalizedWorkDutyId,
                request.bidSeq(),
                normalizedEngineerId
        );

        List<WorkOverlapDocumentTargetEntity> targets = items.stream()
                .filter(item -> item != null && item.contractNo() != null && !item.contractNo().isBlank())
                .map(item -> new WorkOverlapDocumentTargetEntity(
                        request.bidSeq(),
                        normalizedWorkDutyId,
                        normalizedEngineerId,
                        item.contractNo().trim(),
                        item.displayOrder(),
                        normalizeResponsibility(item.responsibility())
                ))
                .toList();

        return targetRepository.saveAll(targets).stream().map(this::toResponse).toList();
    }

    @Transactional
    public void delete(String workDutyId, Long bidSeq, String engineerId, String contractNo) {
        validateKey(workDutyId, bidSeq, engineerId);
        if (contractNo == null || contractNo.isBlank()) {
            throw badRequest("contractNo is required.");
        }
        targetRepository.deleteByWorkDutyIdAndBidSeqAndEngineerIdAndContractNo(workDutyId.trim(), bidSeq, engineerId.trim(), contractNo.trim());
    }

    private WorkOverlapDocumentTargetResponse toResponse(WorkOverlapDocumentTargetEntity entity) {
        return new WorkOverlapDocumentTargetResponse(
                entity.getTargetId(), entity.getBidSeq(), entity.getWorkDutyId(), entity.getEngineerId(), entity.getContractNo(),
                entity.getDisplayOrder(), entity.getResponsibility());
    }

    private void validateKey(String workDutyId, Long bidSeq, String engineerId) {
        if (workDutyId == null || workDutyId.isBlank() || bidSeq == null || engineerId == null || engineerId.isBlank()) {
            throw badRequest("공고와 기술인은 필수입니다.");
        }
    }

    private WorkOverlapApplicationException badRequest(String message) {
        return new WorkOverlapApplicationException(WorkOverlapApplicationException.Type.BAD_REQUEST, message);
    }

    private String normalizeResponsibility(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }
}
