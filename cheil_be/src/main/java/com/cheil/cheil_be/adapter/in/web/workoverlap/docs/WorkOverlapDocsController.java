package com.cheil.cheil_be.adapter.in.web.workoverlap.docs;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.common.paging.PageRequests;
import com.cheil.cheil_be.application.workoverlap.docs.WorkOverlapDocumentContractsQueryService;

@RestController
@RequestMapping("/work-overlap-docs")
@RequiredArgsConstructor
public class WorkOverlapDocsController {

    private static final Sort DEFAULT_SORT = Sort.by(
            Sort.Order.asc("contractNo"),
            Sort.Order.asc("serviceType")
    );

    private final WorkOverlapDocumentContractsQueryService contractQueryService;

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
