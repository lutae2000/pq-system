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
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import com.cheil.cheil_be.application.engineerperformancedoc.service.EngineerPerformanceDocumentService;
import com.cheil.cheil_be.application.engineerperformancedoc.service.HwpxDocumentGenerationService;
import com.cheil.cheil_be.application.engineerperformancedoc.service.PerformanceCertificateGenerationService;

@RestController
@RequestMapping("/pq/engineer-performance-docs")
@RequiredArgsConstructor
public class EngineerPerformanceDocumentController {

    private final EngineerPerformanceDocumentService engineerPerformanceDocumentService;
    private final HwpxDocumentGenerationService hwpxDocumentGenerationService;
    private final PerformanceCertificateGenerationService performanceCertificateGenerationService;

    @PostMapping("/performance-certificates/generate")
    public ResponseEntity<byte[]> generatePerformanceCertificate(
            @RequestBody PerformanceCertificateGenerateRequest request
    ) {
        byte[] content = performanceCertificateGenerationService.generate(request);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(content.length)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename("실적증명서.hwpx", java.nio.charset.StandardCharsets.UTF_8)
                        .build().toString())
                .body(content);
    }

    @PostMapping("/performance-certificates/generate-batch")
    public ResponseEntity<byte[]> generatePerformanceCertificateBatch(
            @RequestBody PerformanceCertificateGenerateRequest request
    ) {
        byte[] content = performanceCertificateGenerationService.generateBatch(request);
        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("application/zip"))
                .contentLength(content.length)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename("실적증명서.zip", java.nio.charset.StandardCharsets.UTF_8)
                        .build().toString())
                .body(content);
    }

    @PostMapping(value = "/hwpx/inspect", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<HwpxTemplateFieldResponse>> inspectHwpx(@RequestPart("template") MultipartFile template) {
        return ResponseEntity.ok(hwpxDocumentGenerationService.inspect(template));
    }

    @PostMapping(value = "/hwpx/generate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> generateHwpx(
            @RequestPart("template") MultipartFile template,
            @RequestPart("request") HwpxGenerateRequest request
    ) {
        byte[] content = hwpxDocumentGenerationService.generate(template, request);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(content.length)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename("기술인실적_산출물.zip", java.nio.charset.StandardCharsets.UTF_8)
                        .build().toString())
                .body(content);
    }

    @GetMapping("/project-histories")
    public ResponseEntity<List<EngineerProjectHistoryReviewResponse>> listProjectHistories(
            @RequestParam String engineerId,
            @RequestParam(required = false) String relatedProjectHistoryConditions
    ) {
        return ResponseEntity.ok(
                engineerPerformanceDocumentService.findProjectHistories(engineerId, relatedProjectHistoryConditions)
        );
    }

    @GetMapping("/document-value-settings")
    public ResponseEntity<List<EngineerDocumentValueSettingResponse>> listDocumentValueSettings(@RequestParam Long bidSeq) {
        return ResponseEntity.ok(engineerPerformanceDocumentService.findDocumentValueSettings(bidSeq));
    }

    @PutMapping("/document-value-settings")
    public ResponseEntity<EngineerDocumentValueSettingResponse> saveDocumentValueSetting(
            @RequestBody EngineerDocumentValueSettingRequest request
    ) {
        return ResponseEntity.ok(engineerPerformanceDocumentService.saveDocumentValueSetting(request));
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
