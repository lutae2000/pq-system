package com.cheil.cheil_be.application.serviceperformance.port.in;

public interface ServicePerformanceUseCase {

    ServicePerformancePage findAll(String keyword, String clientCode, String fieldName, String siteName,
                                    String referenceDate, String periodType, ServicePerformancePageQuery pageQuery);

    ServicePerformanceView findById(Long id);

    ServicePerformanceView create(ServicePerformanceCommand command);

    ServicePerformanceView update(Long id, ServicePerformanceCommand command);

    void delete(Long id);
}
