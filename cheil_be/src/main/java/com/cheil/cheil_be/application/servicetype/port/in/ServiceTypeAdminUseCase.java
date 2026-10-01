package com.cheil.cheil_be.application.servicetype.port.in;

import java.util.List;

import com.cheil.cheil_be.domain.servicetype.ServiceType;

/**
 * 용역구분 관리 기능의 inbound use case 경계다.
 */
public interface ServiceTypeAdminUseCase {

    List<ServiceType> findAll();

    ServiceType findByServiceTypeCode(String serviceTypeCode);

    ServiceType create(ServiceTypeUpsertCommand request);

    ServiceType update(String serviceTypeCode, ServiceTypeUpsertCommand request);

    void delete(String serviceTypeCode);
}
