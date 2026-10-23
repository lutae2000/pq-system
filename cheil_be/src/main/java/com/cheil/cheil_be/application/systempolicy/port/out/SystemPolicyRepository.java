package com.cheil.cheil_be.application.systempolicy.port.out;

import java.util.List;
import java.util.Optional;

import com.cheil.cheil_be.application.systempolicy.model.SystemPolicy;

public interface SystemPolicyRepository {
    List<SystemPolicy> findAll();
    Optional<SystemPolicy> findByKey(String policyKey);
    boolean existsByKey(String policyKey);
    SystemPolicy save(SystemPolicy policy);
}
