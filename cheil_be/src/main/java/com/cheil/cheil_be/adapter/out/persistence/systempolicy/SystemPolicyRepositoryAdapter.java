package com.cheil.cheil_be.adapter.out.persistence.systempolicy;

import java.util.List;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import com.cheil.cheil_be.application.systempolicy.model.SystemPolicy;
import com.cheil.cheil_be.application.systempolicy.port.out.SystemPolicyRepository;

@Repository
@RequiredArgsConstructor
public class SystemPolicyRepositoryAdapter implements SystemPolicyRepository {

    private final JpaSystemPolicyRepository repository;

    @Override
    public List<SystemPolicy> findAll() {
        return repository.findAllByOrderBySortSeqAscPolicyKeyAsc().stream()
                .map(SystemPolicyEntity::toModel)
                .toList();
    }

    @Override
    public Optional<SystemPolicy> findByKey(String policyKey) {
        return repository.findById(policyKey).map(SystemPolicyEntity::toModel);
    }

    @Override
    public boolean existsByKey(String policyKey) {
        return repository.existsById(policyKey);
    }

    @Override
    public SystemPolicy save(SystemPolicy policy) {
        SystemPolicyEntity entity = repository.findById(policy.policyKey())
                .map(existing -> existing.update(policy))
                .orElseGet(() -> SystemPolicyEntity.from(policy));
        return repository.save(entity).toModel();
    }
}
