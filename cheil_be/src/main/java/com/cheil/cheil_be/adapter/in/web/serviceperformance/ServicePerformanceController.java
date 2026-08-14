package com.cheil.cheil_be.adapter.in.web.serviceperformance;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
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

import com.cheil.cheil_be.application.serviceperformance.service.ServicePerformanceService;
import com.cheil.cheil_be.common.paging.PageRequests;
import com.cheil.cheil_be.common.web.PageResponse;

@RestController
@RequestMapping("/pq/service-performance-management")
@RequiredArgsConstructor
public class ServicePerformanceController {

    private final ServicePerformanceService servicePerformanceService;

    @GetMapping
    public ResponseEntity<PageResponse<ServicePerformanceResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String clientCode,
            @RequestParam(required = false) String fieldName,
            @RequestParam(required = false) String siteName,
            @RequestParam(required = false) String referenceDate,
            @RequestParam(required = false) String periodType,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false) Integer size
    ) {
        Page<ServicePerformanceResponse> result = servicePerformanceService.findAll(
                keyword,
                clientCode,
                fieldName,
                siteName,
                referenceDate,
                periodType,
                PageRequests.of(page, size)
        );
        return ResponseEntity.ok(PageResponse.from(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServicePerformanceResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(servicePerformanceService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ServicePerformanceResponse> create(@RequestBody ServicePerformanceRequest request) {
        return ResponseEntity.ok(servicePerformanceService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServicePerformanceResponse> update(
            @PathVariable Long id,
            @RequestBody ServicePerformanceRequest request
    ) {
        return ResponseEntity.ok(servicePerformanceService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        servicePerformanceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
