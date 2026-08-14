package com.cheil.cheil_be.application.servicetype.port.out;

import java.util.List;
import java.util.Optional;

import com.cheil.cheil_be.domain.servicetype.ServiceType;

public interface ServiceTypeRepository {
    List<ServiceType> findAll();

    Optional<ServiceType> findByServiceTypeCode(String serviceTypeCode);

    boolean existsByServiceTypeCode(String serviceTypeCode);

    ServiceType save(ServiceType serviceType);

    void deleteByServiceTypeCode(String serviceTypeCode);
}
