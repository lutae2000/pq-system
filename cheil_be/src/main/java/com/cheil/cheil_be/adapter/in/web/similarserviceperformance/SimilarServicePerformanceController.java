package com.cheil.cheil_be.adapter.in.web.similarserviceperformance;

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

import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformanceSearch;
import com.cheil.cheil_be.application.similarserviceperformance.port.in.SimilarServicePerformanceUseCase;
import com.cheil.cheil_be.common.paging.PageRequests;
import com.cheil.cheil_be.common.web.PageResponse;

@RestController
@RequestMapping("/pq/similar-service-performances")
@RequiredArgsConstructor
public class SimilarServicePerformanceController {

    private final SimilarServicePerformanceUseCase useCase;

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
        var paging = PageRequests.of(page, size);
        var result = useCase.findAll(new SimilarServicePerformanceSearch(
                keyword, constructionType, client, contractFromDate, contractToDate,
                paging.getPageNumber(), paging.getPageSize()
        ));
        return ResponseEntity.ok(new PageResponse<>(
                result.content().stream().map(SimilarServicePerformanceResponse::from).toList(),
                result.page(), result.size(), result.totalElements(), result.totalPages(), result.first(), result.last()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SimilarServicePerformanceResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(SimilarServicePerformanceResponse.from(useCase.findById(id)));
    }

    @PostMapping
    public ResponseEntity<SimilarServicePerformanceResponse> create(@RequestBody SimilarServicePerformanceRequest request) {
        return ResponseEntity.ok(SimilarServicePerformanceResponse.from(useCase.create(request.toCommand())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SimilarServicePerformanceResponse> update(
            @PathVariable Long id,
            @RequestBody SimilarServicePerformanceRequest request
    ) {
        return ResponseEntity.ok(SimilarServicePerformanceResponse.from(useCase.update(id, request.toCommand())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        useCase.delete(id);
        return ResponseEntity.noContent().build();
    }
}
