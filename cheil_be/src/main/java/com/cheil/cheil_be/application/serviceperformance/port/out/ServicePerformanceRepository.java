package com.cheil.cheil_be.application.serviceperformance.port.out;

import com.cheil.cheil_be.application.serviceperformance.port.in.ServicePerformanceCommand;
import com.cheil.cheil_be.application.serviceperformance.port.in.ServicePerformancePage;
import com.cheil.cheil_be.application.serviceperformance.port.in.ServicePerformancePageQuery;
import com.cheil.cheil_be.application.serviceperformance.port.in.ServicePerformanceView;
public interface ServicePerformanceRepository {

    ServicePerformancePage findAll(ServicePerformanceSearch search, ServicePerformancePageQuery pageQuery);

    ServicePerformanceView findById(Long id);

    Long create(ServicePerformanceCommand command, String actor);

    int update(Long id, ServicePerformanceCommand command, String actor);

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
