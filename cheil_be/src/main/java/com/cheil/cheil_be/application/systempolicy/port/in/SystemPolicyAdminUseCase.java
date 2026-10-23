package com.cheil.cheil_be.application.systempolicy.port.in;

import java.util.List;
import java.util.Optional;

import com.cheil.cheil_be.application.systempolicy.model.SystemPolicy;

public interface SystemPolicyAdminUseCase {
    List<SystemPolicy> findPolicies();
    List<SystemPolicy> savePolicies(List<SystemPolicy> policies);
    SystemPolicy createPolicy(SystemPolicy policy);
    SystemPolicy updatePolicy(String policyKey, SystemPolicy policy);
    Optional<SystemPolicy> findEnabledPolicy(String policyKey);
    SystemPolicy upsertTextPolicy(String policyKey, String policyName, String policyValue, int sortSeq, String description);
}
