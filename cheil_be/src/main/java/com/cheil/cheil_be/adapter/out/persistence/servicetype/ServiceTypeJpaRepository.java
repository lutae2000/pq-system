package com.cheil.cheil_be.adapter.out.persistence.servicetype;

import java.util.List;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.servicetype.port.out.ServiceTypeRepository;
import com.cheil.cheil_be.domain.servicetype.ServiceType;

@Repository
@RequiredArgsConstructor
public class ServiceTypeJpaRepository implements ServiceTypeRepository {

    private final JpaServiceTypeRepository jpaServiceTypeRepository;

    @Override
    public List<ServiceType> findAll() {
        return jpaServiceTypeRepository.findAll().stream()
                .map(ServiceTypeEntity::toDomain)
                .toList();
    }

    @Override
    public Optional<ServiceType> findByServiceTypeCode(String serviceTypeCode) {
        return jpaServiceTypeRepository.findById(serviceTypeCode).map(ServiceTypeEntity::toDomain);
    }

    @Override
    public boolean existsByServiceTypeCode(String serviceTypeCode) {
        return jpaServiceTypeRepository.existsById(serviceTypeCode);
    }

    @Override
    @Transactional
    public ServiceType save(ServiceType serviceType) {
        return jpaServiceTypeRepository.findById(serviceType.serviceTypeCode())
                .map(existing -> {
                    existing.updateFrom(serviceType);
                    return jpaServiceTypeRepository.save(existing).toDomain();
                })
                .orElseGet(() -> jpaServiceTypeRepository.save(ServiceTypeEntity.from(serviceType)).toDomain());
    }

    @Override
    @Transactional
    public void deleteByServiceTypeCode(String serviceTypeCode) {
        jpaServiceTypeRepository.deleteById(serviceTypeCode);
    }
}
