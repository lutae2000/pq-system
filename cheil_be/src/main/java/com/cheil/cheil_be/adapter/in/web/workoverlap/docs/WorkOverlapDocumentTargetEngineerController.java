package com.cheil.cheil_be.adapter.in.web.workoverlap.docs;

import java.util.List;
import java.util.Objects;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.application.workoverlap.docs.WorkOverlapDocumentTargetEngineerService;
import com.cheil.cheil_be.application.workoverlap.docs.model.WorkOverlapEngineerSelection;
import com.cheil.cheil_be.application.workoverlap.docs.port.in.ReplaceWorkOverlapEngineersUseCase;

/** 업무중복도 문서 대상 기술자와 표시 정보를 관리하는 API다. */
@RestController
@RequestMapping("/pq/work-overlap-document-engineers")
@RequiredArgsConstructor
public class WorkOverlapDocumentTargetEngineerController {
    private final WorkOverlapDocumentTargetEngineerService service;
    private final ReplaceWorkOverlapEngineersUseCase replaceEngineers;

    @GetMapping
    public ResponseEntity<List<WorkOverlapDocumentTargetEngineerResponse>> list(@RequestParam Long bidSeq, @RequestParam String workDutyId, @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(service.find(bidSeq, workDutyId, keyword).stream()
                .map(WorkOverlapDocumentTargetEngineerResponse::from)
                .toList());
    }

    @PutMapping
    public ResponseEntity<List<WorkOverlapDocumentTargetEngineerResponse>> replace(@RequestBody WorkOverlapDocumentTargetEngineerRequest request) {
        var engineers = request.engineers() == null ? List.<WorkOverlapEngineerSelection>of() : request.engineers().stream()
                .filter(Objects::nonNull)
                .map(item -> new WorkOverlapEngineerSelection(item.engrId(), item.displayOrder(), item.responsibility()))
                .toList();
        return ResponseEntity.ok(replaceEngineers.replace(request.bidSeq(), request.workDutyId(), engineers).stream()
                .map(WorkOverlapDocumentTargetEngineerResponse::from)
                .toList());
    }

    @PatchMapping
    public ResponseEntity<Void> update(@RequestBody WorkOverlapDocumentEngineerUpdateRequest request) {
        service.update(request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> delete(@RequestParam Long bidSeq, @RequestParam String workDutyId, @RequestParam String engrId) {
        service.delete(bidSeq, workDutyId, engrId);
        return ResponseEntity.noContent().build();
    }
}
