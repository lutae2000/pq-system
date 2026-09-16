package com.cheil.cheil_be.application.workoverlap.docs;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.workoverlap.docs.WorkOverlapDocumentTargetEngineerItem;
import com.cheil.cheil_be.adapter.in.web.workoverlap.docs.WorkOverlapDocumentEngineerUpdateRequest;
import com.cheil.cheil_be.adapter.in.web.workoverlap.docs.WorkOverlapDocumentTargetEngineerRequest;
import com.cheil.cheil_be.adapter.out.persistence.workoverlap.docs.WorkOverlapDocumentTargetEngineerEntity;
import com.cheil.cheil_be.adapter.out.persistence.workoverlap.docs.WorkOverlapDocumentTargetEngineerJpaRepository;
import com.cheil.cheil_be.application.workoverlap.docs.port.out.WorkOverlapDocumentTargetEngineerQueryRepository;

@Service
@RequiredArgsConstructor
public class WorkOverlapDocumentTargetEngineerService {
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
                normalize(keyword)
        );
    }

    @Transactional
    public List<WorkOverlapDocumentTargetEngineerData> replace(WorkOverlapDocumentTargetEngineerRequest request) {
        validateKey(request == null ? null : request.bidSeq(), request == null ? null : request.workDutyId(), null);
        String workDutyId = request.workDutyId().trim();
        Map<String, WorkOverlapDocumentTargetEngineerItem> requested = new LinkedHashMap<>();
        (request.engineers() == null ? List.<WorkOverlapDocumentTargetEngineerItem>of() : request.engineers())
                .stream()
                .filter(item -> item != null && item.engrId() != null && !item.engrId().isBlank())
                .forEach(item -> requested.put(item.engrId().trim(), item));

        List<WorkOverlapDocumentTargetEngineerEntity> existing = repository.findByWorkDutyIdAndBidSeqOrderByDisplayOrderAscTargetIdAsc(workDutyId, request.bidSeq());
        existing.stream()
                .filter(row -> !requested.containsKey(row.getEngrId()))
                .forEach(row -> repository.deleteByWorkDutyIdAndBidSeqAndEngrId(workDutyId, request.bidSeq(), row.getEngrId()));

        List<WorkOverlapDocumentTargetEngineerEntity> next = requested.entrySet().stream().map(entry -> {
            WorkOverlapDocumentTargetEngineerItem item = entry.getValue();
            WorkOverlapDocumentTargetEngineerEntity row = repository.findByWorkDutyIdAndBidSeqAndEngrId(workDutyId, request.bidSeq(), entry.getKey());
            if (row == null) {
                return new WorkOverlapDocumentTargetEngineerEntity(request.bidSeq(), workDutyId, entry.getKey(), item.displayOrder(), normalize(item.responsibility()));
            }
            row.update(item.displayOrder(), normalize(item.responsibility()));
            return row;
        }).toList();
        repository.saveAll(next);
        return find(request.bidSeq(), workDutyId, null);
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
        row.update(request.displayOrder(), normalize(request.responsibility()));
        repository.save(row);
    }

    private void validateKey(Long bidSeq, String workDutyId, String engineerId) {
        if (bidSeq == null || workDutyId == null || workDutyId.isBlank() || (engineerId != null && engineerId.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "bidSeq and workDutyId are required.");
        }
    }

    private String normalize(String value) {
        return value == null || value.trim().isBlank() ? null : value.trim();
    }
}
