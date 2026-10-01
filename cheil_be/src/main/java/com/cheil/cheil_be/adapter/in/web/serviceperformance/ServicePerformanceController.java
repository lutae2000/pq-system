package com.cheil.cheil_be.adapter.in.web.serviceperformance;

import com.cheil.cheil_be.application.serviceperformance.port.in.ServicePerformanceCommand;
import com.cheil.cheil_be.application.serviceperformance.port.in.ServicePerformancePage;
import com.cheil.cheil_be.application.serviceperformance.port.in.ServicePerformancePageQuery;
import com.cheil.cheil_be.application.serviceperformance.port.in.ServicePerformanceUseCase;
import com.cheil.cheil_be.common.paging.PageRequests;
import com.cheil.cheil_be.common.web.PageResponse;
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
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false) Integer size
    ) {
        ServicePerformancePage result = servicePerformanceUseCase.findAll(
                keyword,
                clientCode,
                fieldName,
                siteName,
                referenceDate,
                periodType,
                toPageQuery(page, size)
        );
        // application 결과를 HTTP 응답 DTO로 변환하는 책임은 inbound adapter 경계에 둡니다.
        return ResponseEntity.ok(new PageResponse<>(
                result.content().stream().map(ServicePerformanceResponse::from).toList(),
                result.page(),
                result.size(),
                result.totalElements(),
                result.totalPages(),
                result.first(),
                result.last()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServicePerformanceResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(ServicePerformanceResponse.from(servicePerformanceUseCase.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ServicePerformanceResponse> create(@RequestBody ServicePerformanceRequest request) {
        return ResponseEntity.ok(ServicePerformanceResponse.from(
                servicePerformanceUseCase.create(toCommand(request))
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServicePerformanceResponse> update(
            @PathVariable Long id,
            @RequestBody ServicePerformanceRequest request
    ) {
        return ResponseEntity.ok(ServicePerformanceResponse.from(
                servicePerformanceUseCase.update(id, toCommand(request))
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        servicePerformanceUseCase.delete(id);
        return ResponseEntity.noContent().build();
    }

    private static ServicePerformancePageQuery toPageQuery(Integer page, Integer size) {
        var pageable = PageRequests.of(page, size);
        return new ServicePerformancePageQuery(pageable.getPageNumber(), pageable.getPageSize());
    }

    private static ServicePerformanceCommand toCommand(ServicePerformanceRequest request) {
        return request == null ? null : request.toCommand();
    }
}