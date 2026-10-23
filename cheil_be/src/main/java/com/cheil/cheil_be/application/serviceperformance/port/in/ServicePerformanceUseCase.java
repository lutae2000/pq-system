package com.cheil.cheil_be.application.serviceperformance.port.in;

import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceCommand;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceQuery;
import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceView;

public interface ServicePerformanceUseCase {

    Page<ServicePerformanceView> findAll(ServicePerformanceQuery query, Pageable pageable);

    ServicePerformanceView findById(Long id);

    ServicePerformanceView create(ServicePerformanceCommand command);

    ServicePerformanceView update(Long id, ServicePerformanceCommand command);

    void delete(Long id);
}
