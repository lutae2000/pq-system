package com.cheil.cheil_be.adapter.in.web.similarserviceperformance;

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

import com.cheil.cheil_be.application.similarserviceperformance.service.SimilarServicePerformanceService;
import com.cheil.cheil_be.common.paging.PageRequests;
import com.cheil.cheil_be.common.web.PageResponse;

@RestController
@RequestMapping("/pq/similar-service-performances")
@RequiredArgsConstructor
public class SimilarServicePerformanceController {

    private static final Sort DEFAULT_SORT = Sort.by(
            Sort.Order.desc("constructionToDate"),
            Sort.Order.desc("companyPerformanceSeq")
    );

    private final SimilarServicePerformanceService similarServicePerformanceService;

    @GetMapping
    public ResponseEntity<PageResponse<SimilarServicePerformanceResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String constructionType,
            @RequestParam(required = false) String client,
            @RequestParam(required = false) String contractFromDate,
            @RequestParam(required = false) String contractToDate,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false) Integer size
    ) {
        Page<SimilarServicePerformanceResponse> result = similarServicePerformanceService.findAll(
                keyword,
                constructionType,
                client,
                contractFromDate,
                contractToDate,
                PageRequests.of(page, size, DEFAULT_SORT)
        );
        return ResponseEntity.ok(PageResponse.from(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SimilarServicePerformanceResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(similarServicePerformanceService.findById(id));
    }

    @PostMapping
    public ResponseEntity<SimilarServicePerformanceResponse> create(@RequestBody SimilarServicePerformanceRequest request) {
        return ResponseEntity.ok(similarServicePerformanceService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SimilarServicePerformanceResponse> update(
            @PathVariable Long id,
            @RequestBody SimilarServicePerformanceRequest request
    ) {
        return ResponseEntity.ok(similarServicePerformanceService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        similarServicePerformanceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
