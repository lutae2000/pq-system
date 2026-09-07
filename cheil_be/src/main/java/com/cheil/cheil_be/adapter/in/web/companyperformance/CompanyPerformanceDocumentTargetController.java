package com.cheil.cheil_be.adapter.in.web.companyperformance;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.application.companyperformance.service.CompanyPerformanceDocumentTargetService;
import com.cheil.cheil_be.application.companyperformance.service.CompanyPerformanceHwpxGenerationService;

@RestController
@RequestMapping("/pq/company-performance-document-targets")
@RequiredArgsConstructor
public class CompanyPerformanceDocumentTargetController {

    private final CompanyPerformanceDocumentTargetService targetService;
    private final CompanyPerformanceHwpxGenerationService companyPerformanceHwpxGenerationService;

    @GetMapping
    public ResponseEntity<List<CompanyPerformanceDocumentTargetResponse>> list(@RequestParam Long bidSeq) {
        return ResponseEntity.ok(targetService.findByBidSeq(bidSeq));
    }

    @PostMapping
    public ResponseEntity<List<CompanyPerformanceDocumentTargetResponse>> add(@RequestBody CompanyPerformanceDocumentTargetRequest request) {
        return ResponseEntity.ok(targetService.add(request.bidSeq(), request.companyPerformanceSeqs()));
    }

    @PostMapping("/conditions")
    public ResponseEntity<List<CompanyPerformanceDocumentTargetResponse>> addByConditions(
            @RequestBody CompanyPerformanceDocumentTargetConditionRequest request
    ) {
        return ResponseEntity.ok(targetService.addByConditions(request.bidSeq(), request.conditions()));
    }

    @PostMapping(value = "/hwpx/generate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> generateHwpx(
            @RequestPart("template") MultipartFile template,
            @RequestPart("request") CompanyPerformanceHwpxGenerateRequest request
    ) {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(companyPerformanceHwpxGenerationService.generate(template, request));
    }

    @DeleteMapping("/{targetId}")
    public ResponseEntity<Void> delete(@RequestParam Long bidSeq, @PathVariable Long targetId) {
        targetService.delete(bidSeq, targetId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{targetId}/display-order")
    public ResponseEntity<Void> updateDisplayOrder(
            @RequestParam Long bidSeq,
            @PathVariable Long targetId,
            @RequestBody CompanyPerformanceDocumentTargetDisplayOrderRequest request
    ) {
        targetService.updateDisplayOrder(bidSeq, targetId, request);
        return ResponseEntity.noContent().build();
    }
}
