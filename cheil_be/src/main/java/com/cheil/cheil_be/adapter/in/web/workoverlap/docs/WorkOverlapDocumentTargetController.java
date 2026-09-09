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

import com.cheil.cheil_be.application.workoverlap.docs.WorkOverlapDocumentTargetService;

@RestController
@RequestMapping("/pq/work-overlap-document-targets")
@RequiredArgsConstructor
public class WorkOverlapDocumentTargetController {

    private final WorkOverlapDocumentTargetService targetService;

    @GetMapping
    public ResponseEntity<List<WorkOverlapDocumentTargetResponse>> list(
            @RequestParam Long bidSeq,
            @RequestParam String workDutyId,
            @RequestParam String engineerId
    ) {
        return ResponseEntity.ok(targetService.findByWorkDutyIdAndBidSeqAndEngineerId(workDutyId, bidSeq, engineerId));
    }

    @PostMapping
    public ResponseEntity<List<WorkOverlapDocumentTargetResponse>> replace(
            @RequestBody WorkOverlapDocumentTargetRequest request
    ) {
        return ResponseEntity.ok(targetService.replace(request));
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
}
