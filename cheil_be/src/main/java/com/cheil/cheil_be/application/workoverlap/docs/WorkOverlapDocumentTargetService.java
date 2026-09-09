package com.cheil.cheil_be.application.workoverlap.docs;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.workoverlap.docs.WorkOverlapDocumentTargetItem;
import com.cheil.cheil_be.adapter.in.web.workoverlap.docs.WorkOverlapDocumentTargetRequest;
import com.cheil.cheil_be.adapter.in.web.workoverlap.docs.WorkOverlapDocumentTargetResponse;
import com.cheil.cheil_be.adapter.out.persistence.workoverlap.docs.WorkOverlapDocumentTargetEntity;
import com.cheil.cheil_be.adapter.out.persistence.workoverlap.docs.WorkOverlapDocumentTargetJpaRepository;

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
        List<WorkOverlapDocumentTargetEntity> existing = targetRepository
                .findByWorkDutyIdAndBidSeqAndEngineerIdOrderByDisplayOrderAscTargetIdAsc(request.workDutyId().trim(), request.bidSeq(), request.engineerId());
        Map<String, WorkOverlapDocumentTargetEntity> mergedByContractNo = new LinkedHashMap<>();
        existing.forEach(target -> mergedByContractNo.put(target.getContractNo(), target));

        items.stream()
                .filter(item -> item != null && item.contractNo() != null && !item.contractNo().isBlank())
                .forEach(item -> {
                    String contractNo = item.contractNo().trim();
                    WorkOverlapDocumentTargetEntity target = mergedByContractNo.get(contractNo);
                    if (target == null) {
                        mergedByContractNo.put(contractNo, new WorkOverlapDocumentTargetEntity(
                                request.bidSeq(),
                                request.workDutyId().trim(),
                                request.engineerId().trim(),
                                contractNo,
                                item.displayOrder(),
                                normalizeResponsibility(item.responsibility())));
                    } else {
                        target.update(item.displayOrder(), normalizeResponsibility(item.responsibility()));
                    }
                });

        return targetRepository.saveAll(mergedByContractNo.values()).stream().map(this::toResponse).toList();
    }

    @Transactional
    public void delete(String workDutyId, Long bidSeq, String engineerId, String contractNo) {
        validateKey(workDutyId, bidSeq, engineerId);
        if (contractNo == null || contractNo.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "contractNo is required.");
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
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "공고와 기술인은 필수입니다.");
        }
    }

    private String normalizeResponsibility(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }
}
