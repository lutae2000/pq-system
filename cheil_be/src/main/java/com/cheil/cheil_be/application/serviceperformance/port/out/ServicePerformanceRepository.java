package com.cheil.cheil_be.application.serviceperformance.port.out;

import com.cheil.cheil_be.adapter.in.web.serviceperformance.ServicePerformanceRequest;
import com.cheil.cheil_be.adapter.in.web.serviceperformance.ServicePerformanceResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ServicePerformanceRepository {

    Page<ServicePerformanceResponse> findAll(ServicePerformanceSearch search, Pageable pageable);

    ServicePerformanceResponse findById(Long id);

    Long create(ServicePerformanceRequest request, String actor);

    int update(Long id, ServicePerformanceRequest request, String actor);

    int delete(Long id);

    record ServicePerformanceSearch(
            String keyword,
            String clientCode,
            String fieldName,
            String siteName,
            String referenceDate,
            String periodType,
            String periodLowerDate
    ) {}
}
