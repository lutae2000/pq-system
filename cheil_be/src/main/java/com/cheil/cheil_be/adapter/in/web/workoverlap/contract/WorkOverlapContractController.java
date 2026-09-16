package com.cheil.cheil_be.adapter.in.web.workoverlap.contract;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
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

import java.util.List;

import com.cheil.cheil_be.application.workoverlap.contract.WorkOverlapContractEngineerService;
import com.cheil.cheil_be.application.workoverlap.contract.WorkOverlapContractService;
import com.cheil.cheil_be.common.paging.PageRequests;
import com.cheil.cheil_be.common.web.PageResponse;

@RestController
@RequestMapping("/work-overlap-contracts")
@RequiredArgsConstructor
public class WorkOverlapContractController {

    private static final Sort DEFAULT_SORT = Sort.by(
            Sort.Order.asc("contractNo"),
            Sort.Order.asc("serviceType")
    );

    private final WorkOverlapContractService workOverlapContractService;
    private final WorkOverlapContractEngineerService workOverlapContractEngineerService;

    @GetMapping
    public ResponseEntity<PageResponse<WorkOverlapContractResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String serviceType,
            @RequestParam(required = false) String clientName,
            @RequestParam(required = false) String engineerName,
            @RequestParam(required = false) String constructionStartDateFrom,
            @RequestParam(required = false) String constructionStartDateTo,
            @RequestParam(required = false) String performanceCertification,
            @RequestParam(required = false) String participateListDocument,
            @RequestParam(required = false) Boolean cemsConfirm,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String referenceDate,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false) Integer size
    ) {
        Page<WorkOverlapContractResponse> result = workOverlapContractService.findAll(
                keyword,
                serviceType,
                clientName,
                engineerName,
                constructionStartDateFrom,
                constructionStartDateTo,
                performanceCertification,
                participateListDocument,
                cemsConfirm,
                status,
                referenceDate,
                PageRequests.of(page, size, DEFAULT_SORT)
        );
        return ResponseEntity.ok(PageResponse.from(result));
    }

    @GetMapping("/summary")
    public ResponseEntity<WorkOverlapContractSummaryResponse> summary(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String serviceType,
            @RequestParam(required = false) String clientName,
            @RequestParam(required = false) String engineerName,
            @RequestParam(required = false) String constructionStartDateFrom,
            @RequestParam(required = false) String constructionStartDateTo,
            @RequestParam(required = false) String performanceCertification,
            @RequestParam(required = false) String participateListDocument,
            @RequestParam(required = false) Boolean cemsConfirm,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String referenceDate
    ) {
        return ResponseEntity.ok(workOverlapContractService.summary(
                keyword,
                serviceType,
                clientName,
                engineerName,
                constructionStartDateFrom,
                constructionStartDateTo,
                performanceCertification,
                participateListDocument,
                cemsConfirm,
                status,
                referenceDate
        ));
    }

    @GetMapping("/{contractNo}")
    public ResponseEntity<WorkOverlapContractResponse> get(@PathVariable String contractNo) {
        return ResponseEntity.ok(workOverlapContractService.findByContractNo(contractNo));
    }

    @GetMapping("/engineers/{engineerId}")
    public ResponseEntity<PageResponse<WorkOverlapEngineerContractResponse>> listEngineerContracts(
            @PathVariable String engineerId,
            @RequestParam(required = false) String referenceDate,
            @RequestParam(required = false) String remainingDays,
            @RequestParam(required = false, defaultValue = "false") boolean excludeCompleted,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false) Integer size
    ) {
        // This endpoint is covered by the same read permission as the contract page.
        Page<WorkOverlapEngineerContractResponse> result = workOverlapContractService.findEngineerContracts(
                engineerId,
                referenceDate,
                remainingDays,
                excludeCompleted,
                PageRequests.of(page, size, DEFAULT_SORT)
        );
        return ResponseEntity.ok(PageResponse.from(result));
    }

    @GetMapping("/engineer-candidates")
    public ResponseEntity<List<WorkOverlapContractEngineerCandidateResponse>> listEngineerCandidates(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer limit
    ) {
        return ResponseEntity.ok(workOverlapContractEngineerService.findEngineerCandidates(keyword, limit).stream()
                .map(WorkOverlapContractEngineerCandidateResponse::from)
                .toList());
    }

    @GetMapping("/{contractNo}/engineers")
    public ResponseEntity<List<WorkOverlapContractEngineerResponse>> listEngineers(@PathVariable String contractNo) {
        workOverlapContractService.findByContractNo(contractNo);
        return ResponseEntity.ok(workOverlapContractEngineerService.findByContractNo(contractNo).stream()
                .map(WorkOverlapContractEngineerResponse::from)
                .toList());
    }

    @GetMapping("/{contractNo}/engineer-histories")
    public ResponseEntity<List<WorkOverlapContractEngineerHistoryResponse>> listEngineerHistories(@PathVariable String contractNo) {
        workOverlapContractService.findByContractNo(contractNo);
        return ResponseEntity.ok(workOverlapContractEngineerService.findHistoriesByContractNo(contractNo).stream()
                .map(WorkOverlapContractEngineerHistoryResponse::from)
                .toList());
    }

    @GetMapping("/{contractNo}/period-histories")
    public ResponseEntity<List<WorkOverlapContractPeriodHistoryResponse>> listPeriodHistories(@PathVariable String contractNo) {
        workOverlapContractService.findByContractNo(contractNo);
        return ResponseEntity.ok(workOverlapContractService.findPeriodHistoriesByContractNo(contractNo));
    }

    @DeleteMapping("/{contractNo}/engineer-histories/{historyId}")
    public ResponseEntity<Void> deleteEngineerHistory(
            @PathVariable String contractNo,
            @PathVariable long historyId
    ) {
        workOverlapContractService.findByContractNo(contractNo);
        workOverlapContractEngineerService.deleteHistory(contractNo, historyId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{contractNo}/period-histories/{historyId}")
    public ResponseEntity<Void> deletePeriodHistory(
            @PathVariable String contractNo,
            @PathVariable long historyId
    ) {
        workOverlapContractService.findByContractNo(contractNo);
        workOverlapContractService.deletePeriodHistory(contractNo, historyId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{contractNo}/engineers")
    public ResponseEntity<WorkOverlapContractEngineerResponse> createEngineer(
            @PathVariable String contractNo,
            @RequestBody WorkOverlapContractEngineerRequest request
    ) {
        workOverlapContractService.findByContractNo(contractNo);
        return ResponseEntity.ok(WorkOverlapContractEngineerResponse.from(
                workOverlapContractEngineerService.create(contractNo, request)
        ));
    }

    @PutMapping("/{contractNo}/engineers/{engineerId}")
    public ResponseEntity<WorkOverlapContractEngineerResponse> updateEngineer(
            @PathVariable String contractNo,
            @PathVariable String engineerId,
            @RequestBody WorkOverlapContractEngineerChangeRequest request
    ) {
        workOverlapContractService.findByContractNo(contractNo);
        return ResponseEntity.ok(WorkOverlapContractEngineerResponse.from(
                workOverlapContractEngineerService.update(contractNo, engineerId, request)
        ));
    }

    @DeleteMapping("/{contractNo}/engineers/{engineerId}")
    public ResponseEntity<Void> deleteEngineer(
            @PathVariable String contractNo,
            @PathVariable String engineerId
    ) {
        workOverlapContractService.findByContractNo(contractNo);
        workOverlapContractEngineerService.delete(contractNo, engineerId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<WorkOverlapContractResponse> create(@RequestBody WorkOverlapContractRequest request) {
        return ResponseEntity.ok(workOverlapContractService.create(request));
    }

    @PutMapping("/{contractNo}")
    public ResponseEntity<WorkOverlapContractResponse> update(
            @PathVariable String contractNo,
            @RequestBody WorkOverlapContractRequest request
    ) {
        return ResponseEntity.ok(workOverlapContractService.update(contractNo, request));
    }

    @DeleteMapping("/{contractNo}")
    public ResponseEntity<Void> delete(@PathVariable String contractNo) {
        workOverlapContractService.delete(contractNo);
        return ResponseEntity.noContent().build();
    }
}
