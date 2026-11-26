package com.cheil.cheil_be.application.workoverlap.docs;

import static com.cheil.cheil_be.common.text.StringValues.trimToNull;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.workoverlap.docs.WorkOverlapDocumentEngineerUpdateRequest;
import com.cheil.cheil_be.application.workoverlap.docs.model.WorkOverlapEngineerSelection;
import com.cheil.cheil_be.application.workoverlap.docs.port.in.ReplaceWorkOverlapEngineersUseCase;
import com.cheil.cheil_be.adapter.out.persistence.workoverlap.docs.WorkOverlapDocumentTargetEngineerEntity;
import com.cheil.cheil_be.adapter.out.persistence.workoverlap.docs.WorkOverlapDocumentTargetEngineerJpaRepository;
import com.cheil.cheil_be.application.workoverlap.docs.port.out.WorkOverlapDocumentTargetEngineerQueryRepository;

@Service
@RequiredArgsConstructor
public class WorkOverlapDocumentTargetEngineerService implements ReplaceWorkOverlapEngineersUseCase {
    private final WorkOverlapDocumentTargetEngineerJpaRepository repository;
    private final WorkOverlapDocumentTargetEngineerQueryRepository queryRepository;

    @Transactional(readOnly = true)
    public List<WorkOverlapDocumentTargetEngineerData> find(
            Long bidSeq,
            String workDutyId,
            String keyword
    ) {
        validateKey(bidSeq, workDutyId, null);
        return queryRepository.find(
                bidSeq,
                workDutyId.trim(),
                trimToNull(keyword)
        );
    }

    @Override
    @Transactional
    public List<WorkOverlapDocumentTargetEngineerData> replace(Long bidSeq, String workDutyId, List<WorkOverlapEngineerSelection> engineers) {
        validateKey(bidSeq, workDutyId, null);
        String ownerId = workDutyId.trim();
        Map<String, WorkOverlapEngineerSelection> requested = new LinkedHashMap<>();
        (engineers == null ? List.<WorkOverlapEngineerSelection>of() : engineers)
                .stream()
                .filter(item -> item != null && item.engrId() != null && !item.engrId().isBlank())
                .forEach(item -> requested.put(item.engrId().trim(), item));

        List<WorkOverlapDocumentTargetEngineerEntity> existing = repository.findByWorkDutyIdAndBidSeqOrderByDisplayOrderAscTargetIdAsc(ownerId, bidSeq);
        existing.stream()
                .filter(row -> !requested.containsKey(row.getEngrId()))
                .forEach(row -> repository.deleteByWorkDutyIdAndBidSeqAndEngrId(ownerId, bidSeq, row.getEngrId()));

        List<WorkOverlapDocumentTargetEngineerEntity> next = requested.entrySet().stream().map(entry -> {
            WorkOverlapEngineerSelection item = entry.getValue();
            WorkOverlapDocumentTargetEngineerEntity row = repository.findByWorkDutyIdAndBidSeqAndEngrId(ownerId, bidSeq, entry.getKey());
            if (row == null) {
                return new WorkOverlapDocumentTargetEngineerEntity(bidSeq, ownerId, entry.getKey(), item.displayOrder(), trimToNull(item.responsibility()));
            }
            row.update(item.displayOrder(), trimToNull(item.responsibility()));
            return row;
        }).toList();
        repository.saveAll(next);
        return find(bidSeq, ownerId, null);
    }

    @Transactional
    public void delete(Long bidSeq, String workDutyId, String engrId) {
        validateKey(bidSeq, workDutyId, engrId);
        repository.deleteByWorkDutyIdAndBidSeqAndEngrId(workDutyId.trim(), bidSeq, engrId.trim());
    }

    @Transactional
    public void update(WorkOverlapDocumentEngineerUpdateRequest request) {
        validateKey(request == null ? null : request.bidSeq(), request == null ? null : request.workDutyId(), request == null ? null : request.engrId());
        String workDutyId = request.workDutyId().trim();
        String engrId = request.engrId().trim();
        WorkOverlapDocumentTargetEngineerEntity row = repository.findByWorkDutyIdAndBidSeqAndEngrId(workDutyId, request.bidSeq(), engrId);
        if (row == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Selected engineer was not found.");
        }
        row.update(request.displayOrder(), trimToNull(request.responsibility()));
        repository.save(row);
    }

    private void validateKey(Long bidSeq, String workDutyId, String engineerId) {
        if (bidSeq == null || workDutyId == null || workDutyId.isBlank() || (engineerId != null && engineerId.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "bidSeq and workDutyId are required.");
        }
    }

}
