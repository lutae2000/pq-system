package com.cheil.cheil_be.adapter.in.web.serviceperformance;

import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceQuery;
import com.cheil.cheil_be.application.serviceperformance.port.in.ServicePerformanceUseCase;
import com.cheil.cheil_be.common.paging.PageRequests;
import com.cheil.cheil_be.common.web.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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

/** 용역 수행성과를 조회하고 관리하는 API다. */
@RestController
@RequestMapping("/pq/service-performance-management")
@RequiredArgsConstructor
public class ServicePerformanceController {

    private final ServicePerformanceUseCase servicePerformanceUseCase;

    @GetMapping
    public ResponseEntity<PageResponse<ServicePerformanceResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String clientCode,
            @RequestParam(required = false) String fieldName,
            @RequestParam(required = false) String siteName,
            @RequestParam(required = false) String referenceDate,
            @RequestParam(required = false) String periodType,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        var safePageable = PageRequests.of(pageable);
        var result = servicePerformanceUseCase.findAll(new ServicePerformanceQuery(
                keyword,
                clientCode,
                fieldName,
                siteName,
                referenceDate,
                periodType
        ), safePageable);
        return ResponseEntity.ok(PageResponse.from(result, ServicePerformanceResponse::from));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServicePerformanceResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(ServicePerformanceResponse.from(servicePerformanceUseCase.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ServicePerformanceResponse> create(@Valid @RequestBody ServicePerformanceRequest request) {
        return ResponseEntity.ok(ServicePerformanceResponse.from(
                servicePerformanceUseCase.create(request.toCommand())
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServicePerformanceResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ServicePerformanceRequest request
    ) {
        return ResponseEntity.ok(ServicePerformanceResponse.from(
                servicePerformanceUseCase.update(id, request.toCommand())
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        servicePerformanceUseCase.delete(id);
        return ResponseEntity.noContent().build();
    }

}
