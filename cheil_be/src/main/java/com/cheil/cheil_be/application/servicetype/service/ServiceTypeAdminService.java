package com.cheil.cheil_be.application.servicetype.service;

import java.util.Comparator;
import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.servicetype.exception.ServiceTypeApplicationException;
import com.cheil.cheil_be.application.servicetype.exception.ServiceTypeApplicationException.Type;
import com.cheil.cheil_be.application.servicetype.port.in.ServiceTypeUpsertCommand;
import com.cheil.cheil_be.application.servicetype.port.in.ServiceTypeAdminUseCase;
import com.cheil.cheil_be.application.servicetype.port.out.ServiceTypeRepository;
import com.cheil.cheil_be.common.text.StringValues;
import com.cheil.cheil_be.domain.servicetype.ServiceType;

@Service
@RequiredArgsConstructor
public class ServiceTypeAdminService implements ServiceTypeAdminUseCase {

    private static final int SERVICE_TYPE_CODE_MAX_LENGTH = 20;
    private static final int SERVICE_TYPE_NAME_MAX_LENGTH = 200;

    private final ServiceTypeRepository serviceTypeRepository;

    @Transactional(readOnly = true)
    public List<ServiceType> findAll() {
        return serviceTypeRepository.findAll().stream()
                .sorted(Comparator.comparing(
                        ServiceType::serviceTypeCode,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public ServiceType findByServiceTypeCode(String serviceTypeCode) {
        return serviceTypeRepository.findByServiceTypeCode(StringValues.required(serviceTypeCode, "serviceTypeCode"))
                .orElseThrow(() -> new ServiceTypeApplicationException(Type.NOT_FOUND, "Service type not found."));
    }

    @Transactional
    public ServiceType create(ServiceTypeUpsertCommand request) {
        requireRequest(request);
        String serviceTypeCode = StringValues.required(request.serviceTypeCode(), "serviceTypeCode");
        if (serviceTypeRepository.existsByServiceTypeCode(serviceTypeCode)) {
            throw new ServiceTypeApplicationException(Type.CONFLICT, "Service type code already exists.");
        }

        return serviceTypeRepository.save(normalize(request, serviceTypeCode));
    }

    @Transactional
    public ServiceType update(String serviceTypeCode, ServiceTypeUpsertCommand request) {
        requireRequest(request);
        String normalizedServiceTypeCode = StringValues.required(serviceTypeCode, "serviceTypeCode");
        serviceTypeRepository.findByServiceTypeCode(normalizedServiceTypeCode)
                .orElseThrow(() -> new ServiceTypeApplicationException(Type.NOT_FOUND, "Service type not found."));

        String requestServiceTypeCode = StringValues.normalize(request.serviceTypeCode());
        if (!requestServiceTypeCode.isBlank() && !normalizedServiceTypeCode.equals(requestServiceTypeCode)) {
            throw new ServiceTypeApplicationException(Type.BAD_REQUEST, "path serviceTypeCode must match body serviceTypeCode.");
        }

        return serviceTypeRepository.save(normalize(request, normalizedServiceTypeCode));
    }

    @Transactional
    public void delete(String serviceTypeCode) {
        String normalizedServiceTypeCode = StringValues.required(serviceTypeCode, "serviceTypeCode");
        if (!serviceTypeRepository.existsByServiceTypeCode(normalizedServiceTypeCode)) {
            throw new ServiceTypeApplicationException(Type.NOT_FOUND, "Service type not found.");
        }
        serviceTypeRepository.deleteByServiceTypeCode(normalizedServiceTypeCode);
    }

    private ServiceType normalize(ServiceTypeUpsertCommand request, String serviceTypeCode) {
        String serviceTypeName = StringValues.required(request.serviceTypeName(), "serviceTypeName");

        StringValues.validateMaxLength(serviceTypeCode, SERVICE_TYPE_CODE_MAX_LENGTH, "serviceTypeCode");
        StringValues.validateMaxLength(serviceTypeName, SERVICE_TYPE_NAME_MAX_LENGTH, "serviceTypeName");

        return new ServiceType(
                serviceTypeCode,
                serviceTypeName,
                // 기존 API에서 useYn을 생략하면 활성 상태로 저장해 온 동작을 유지한다.
                request.useYn() == null || request.useYn(),
                null,
                null,
                null,
                null
        );
    }

    private void requireRequest(ServiceTypeUpsertCommand request) {
        if (request == null) {
            throw new ServiceTypeApplicationException(Type.BAD_REQUEST, "Service type request body is required.");
        }
    }
}
