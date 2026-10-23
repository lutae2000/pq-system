package com.cheil.cheil_be.application.serviceperformance.port.out;

import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceSearch;
import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceCommand;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.cheil.cheil_be.application.serviceperformance.model.ServicePerformanceView;
public interface ServicePerformanceRepository {

    Page<ServicePerformanceView> findAll(ServicePerformanceSearch search, Pageable pageable);

    ServicePerformanceView findById(Long id);

    Long create(ServicePerformanceCommand command, String actor);

    int update(Long id, ServicePerformanceCommand command, String actor);

    int delete(Long id);
}
