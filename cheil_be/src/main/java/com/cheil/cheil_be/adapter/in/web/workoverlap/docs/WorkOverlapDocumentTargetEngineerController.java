package com.cheil.cheil_be.adapter.in.web.workoverlap.docs;

import java.util.List;

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

@RestController
@RequestMapping("/pq/work-overlap-document-engineers")
@RequiredArgsConstructor
public class WorkOverlapDocumentTargetEngineerController {
    private final WorkOverlapDocumentTargetEngineerService service;

    @GetMapping
    public ResponseEntity<List<WorkOverlapDocumentTargetEngineerResponse>> list(@RequestParam Long bidSeq, @RequestParam String workDutyId, @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(service.find(bidSeq, workDutyId, keyword).stream()
                .map(WorkOverlapDocumentTargetEngineerResponse::from)
                .toList());
    }

    @PutMapping
    public ResponseEntity<List<WorkOverlapDocumentTargetEngineerResponse>> replace(@RequestBody WorkOverlapDocumentTargetEngineerRequest request) {
        return ResponseEntity.ok(service.replace(request).stream()
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
