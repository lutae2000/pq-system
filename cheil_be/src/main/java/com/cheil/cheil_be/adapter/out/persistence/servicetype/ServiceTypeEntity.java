package com.cheil.cheil_be.adapter.out.persistence.servicetype;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import com.cheil.cheil_be.adapter.out.persistence.common.AuditEntity;
import com.cheil.cheil_be.domain.servicetype.ServiceType;

@Entity
@Table(name = "service_types")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@SuperBuilder
class ServiceTypeEntity extends AuditEntity {

    @Id
    @Column(name = "service_type_code", nullable = false, unique = true, length = 20)
    private String serviceTypeCode;

    @Column(name = "service_type_name", nullable = false, length = 200)
    private String serviceTypeName;

    @Column(name = "use_yn", nullable = false)
    private boolean useYn;

    static ServiceTypeEntity from(ServiceType serviceType) {
        return ServiceTypeEntity.builder()
                .serviceTypeCode(serviceType.serviceTypeCode())
                .serviceTypeName(serviceType.serviceTypeName())
                .useYn(serviceType.useYn())
                .createdAt(serviceType.createdAt())
                .createdId(serviceType.createdId())
                .lastChangedAt(serviceType.lastChangedAt())
                .lastChangedId(serviceType.lastChangedId())
                .build();
    }

    void updateFrom(ServiceType serviceType) {
        serviceTypeName = serviceType.serviceTypeName();
        useYn = serviceType.useYn();
    }

    ServiceType toDomain() {
        return new ServiceType(
                serviceTypeCode,
                serviceTypeName,
                useYn,
                createdAt,
                createdId,
                lastChangedAt,
                lastChangedId
        );
    }
}
