package com.cheil.cheil_be.adapter.in.web.workoverlap.docs;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.application.workoverlap.docs.model.WorkOverlapDocumentTarget;
import com.cheil.cheil_be.application.workoverlap.docs.port.in.WorkOverlapDocumentTargetUseCase;

/** 업무중복도 문서에 포함할 대상 계약을 관리하는 API다. */
@RestController
@RequestMapping("/pq/work-overlap-document-targets")
@RequiredArgsConstructor
public class WorkOverlapDocumentTargetController {

    private final WorkOverlapDocumentTargetUseCase targetService;

    @GetMapping
    public ResponseEntity<List<WorkOverlapDocumentTargetResponse>> list(
            @RequestParam Long bidSeq,
            @RequestParam String workDutyId,
            @RequestParam String engineerId
    ) {
        return ResponseEntity.ok(targetService.find(workDutyId, bidSeq, engineerId).stream().map(this::toResponse).toList());
    }

    @PostMapping
    public ResponseEntity<List<WorkOverlapDocumentTargetResponse>> replace(
            @RequestBody WorkOverlapDocumentTargetRequest request
    ) {
        List<WorkOverlapDocumentTarget> targets = request == null || request.contracts() == null ? List.of() : request.contracts().stream()
                .filter(item -> item != null)
                .map(item -> new WorkOverlapDocumentTarget(null, request.bidSeq(), request.workDutyId(), request.engineerId(),
                        item.contractNo(), item.displayOrder(), item.responsibility()))
                .toList();
        return ResponseEntity.ok(targetService.replace(request == null ? null : request.workDutyId(),
                        request == null ? null : request.bidSeq(), request == null ? null : request.engineerId(), targets)
                .stream().map(this::toResponse).toList());
    }

    @DeleteMapping
    public ResponseEntity<Void> delete(
            @RequestParam Long bidSeq,
            @RequestParam String workDutyId,
            @RequestParam String engineerId,
            @RequestParam String contractNo
    ) {
        targetService.delete(workDutyId, bidSeq, engineerId, contractNo);
        return ResponseEntity.noContent().build();
    }

    private WorkOverlapDocumentTargetResponse toResponse(WorkOverlapDocumentTarget target) {
        return new WorkOverlapDocumentTargetResponse(target.targetId(), target.bidSeq(), target.workDutyId(),
                target.engineerId(), target.contractNo(), target.displayOrder(), target.responsibility());
    }
}
