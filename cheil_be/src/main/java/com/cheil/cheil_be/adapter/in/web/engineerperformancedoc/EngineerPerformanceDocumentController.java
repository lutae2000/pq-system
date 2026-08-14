package com.cheil.cheil_be.adapter.in.web.engineerperformancedoc;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.application.engineerperformancedoc.service.EngineerPerformanceDocumentService;

@RestController
@RequestMapping("/pq/engineer-performance-docs")
@RequiredArgsConstructor
public class EngineerPerformanceDocumentController {

    private final EngineerPerformanceDocumentService engineerPerformanceDocumentService;

    @GetMapping("/project-histories")
    public ResponseEntity<List<EngineerProjectHistoryReviewResponse>> listProjectHistories(
            @RequestParam String engineerId
    ) {
        return ResponseEntity.ok(engineerPerformanceDocumentService.findProjectHistories(engineerId));
    }

    /**
     * 인사이력 검토 결과 목록을 조회한다.
     */
    @GetMapping("/review-results")
    public ResponseEntity<List<EngineerProjectHistoryReviewResponse>> listReviewResults(
            @RequestParam Long bidSeq,
            @RequestParam String engineerId,
            @RequestParam(required = false) String relatedProjectHistoryConditions
    ) {
        return ResponseEntity.ok(
                engineerPerformanceDocumentService.findReviewResults(bidSeq, engineerId, relatedProjectHistoryConditions)
        );
    }

    /**
     * 인사이력 검토 결과를 추가한다.
     */
    @PostMapping("/review-results")
    public ResponseEntity<EngineerProjectHistoryReviewResponse> createReviewResult(
            @RequestBody EngineerProjectHistoryReviewRequest request
    ) {
        return ResponseEntity.ok(engineerPerformanceDocumentService.createReviewResult(request));
    }

    /**
     * 검토 결과를 일괄 동기화한다.
     */
    @PostMapping("/review-results/sync")
    public ResponseEntity<List<EngineerProjectHistoryReviewResponse>> syncReviewResults(
            @RequestBody EngineerProjectHistoryReviewSyncRequest request
    ) {
        return ResponseEntity.ok(engineerPerformanceDocumentService.syncReviewResults(request));
    }

    /**
     * 검토 결과를 수정한다.
     */
    @PutMapping("/review-results/{reviewId}")
    public ResponseEntity<EngineerProjectHistoryReviewResponse> updateReviewResult(
            @PathVariable Long reviewId,
            @RequestBody EngineerProjectHistoryReviewRequest request
    ) {
        return ResponseEntity.ok(engineerPerformanceDocumentService.updateReviewResult(reviewId, request));
    }

    /**
     * 검토 결과를 삭제한다.
     */
    @DeleteMapping("/review-results/{bidSeq}/{engineerId}/{reviewId}")
    public ResponseEntity<Void> deleteReviewResult(
            @PathVariable Long bidSeq,
            @PathVariable String engineerId,
            @PathVariable Long reviewId
    ) {
        engineerPerformanceDocumentService.deleteReviewResult(bidSeq, engineerId, reviewId);
        return ResponseEntity.noContent().build();
    }
}
