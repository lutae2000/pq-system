package com.cheil.cheil_be.adapter.in.web.workoverlap.docs;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.common.paging.PageRequests;
import com.cheil.cheil_be.application.workoverlap.docs.WorkOverlapDocumentContractsQueryService;
import com.cheil.cheil_be.application.engineerperformancedoc.service.PerformanceCertificateGenerationService;
import com.cheil.cheil_be.application.engineerperformancedoc.service.HwpxDocumentGenerationService;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/work-overlap-docs")
@RequiredArgsConstructor
public class WorkOverlapDocsController {

    private static final Sort DEFAULT_SORT = Sort.by(
            Sort.Order.asc("contractNo"),
            Sort.Order.asc("serviceType")
    );

    private final WorkOverlapDocumentContractsQueryService contractQueryService;
    private final PerformanceCertificateGenerationService performanceCertificateGenerationService;
    private final HwpxDocumentGenerationService hwpxDocumentGenerationService;

    @PostMapping(value = "/hwpx/template/generate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> generateTemplateHwpx(
            @RequestPart("template") MultipartFile template,
            @RequestPart("request") WorkOverlapHwpxGenerateRequest request
    ) {
        byte[] content = hwpxDocumentGenerationService.renderWorkOverlap(
                template, request.bidSeq(), request.workDutyId(), request.engineerIds(), request.referenceDate(), request.mappings());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, org.springframework.http.ContentDisposition.attachment()
                        .filename("업무중복도.hwpx", java.nio.charset.StandardCharsets.UTF_8).build().toString())
                .body(content);
    }

    @PostMapping(value = "/hwpx/generate", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<byte[]> generateHwpx(@RequestBody WorkOverlapHwpxGenerateRequest request) {
        byte[] content = performanceCertificateGenerationService.generateWorkOverlapBatch(request);
        String suffix = request.includeParticipantList() == Boolean.TRUE
                ? "업무중복도_계약서_참여자명단.zip" : "업무중복도_계약서.zip";
        String projectName = performanceCertificateGenerationService.findProjectName(request.bidSeq())
                .replaceAll("[\\\\/:*?\"<>|]", "_").trim();
        String filename = (projectName.isBlank() ? "업무중복도" : projectName) + "_" + suffix;
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, org.springframework.http.ContentDisposition.attachment()
                        .filename(filename, java.nio.charset.StandardCharsets.UTF_8).build().toString())
                .body(content);
    }

    @GetMapping("/engineers/{engineerId}")
    public ResponseEntity<WorkOverlapDocumentEngineerContractsResponse> listContracts(
            @PathVariable String engineerId,
            @RequestParam Long bidSeq,
            @RequestParam String workDutyId,
            @RequestParam(required = false) String referenceDate,
            @RequestParam(required = false) String remainingDays,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false) Integer size
    ) {
        WorkOverlapDocumentEngineerContractsResponse result = contractQueryService.findContracts(
                engineerId,
                bidSeq,
                workDutyId,
                referenceDate,
                remainingDays,
                PageRequests.of(page, size, DEFAULT_SORT)
        );
        return ResponseEntity.ok(result);
    }
}
