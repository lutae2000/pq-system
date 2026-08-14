package com.cheil.cheil_be.adapter.in.web.servicetype;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import com.cheil.cheil_be.domain.servicetype.ServiceType;

public record ServiceTypeResponse(
        String serviceTypeCode,
        String serviceTypeName,
        boolean useYn,
        String createdAt,
        String createdId,
        String lastChangedAt,
        String lastChangedId
) {
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static ServiceTypeResponse from(ServiceType serviceType) {
        return new ServiceTypeResponse(
                serviceType.serviceTypeCode(),
                serviceType.serviceTypeName(),
                serviceType.useYn(),
                serviceType.createdAt() == null ? null : serviceType.createdAt().atZone(ZoneId.systemDefault()).format(DATETIME_FORMATTER),
                serviceType.createdId(),
                serviceType.lastChangedAt() == null ? null : serviceType.lastChangedAt().atZone(ZoneId.systemDefault()).format(DATETIME_FORMATTER),
                serviceType.lastChangedId()
        );
    }
}
