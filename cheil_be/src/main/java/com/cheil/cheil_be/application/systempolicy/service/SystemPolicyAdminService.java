package com.cheil.cheil_be.application.systempolicy.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.out.persistence.systempolicy.JpaSystemPolicyRepository;
import com.cheil.cheil_be.adapter.out.persistence.systempolicy.SystemPolicyEntity;

@Service
@Transactional
public class SystemPolicyAdminService {

    private final JpaSystemPolicyRepository systemPolicyRepository;

    public SystemPolicyAdminService(JpaSystemPolicyRepository systemPolicyRepository) {
        this.systemPolicyRepository = systemPolicyRepository;
    }

    @Transactional(readOnly = true)
    public List<SystemPolicyEntity> findPolicies() {
        return systemPolicyRepository.findAllByOrderBySortSeqAscPolicyKeyAsc();
    }

    public List<SystemPolicyEntity> savePolicies(List<SystemPolicyEntity> policies) {
        if (policies == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "policy list is required");
        }

        for (SystemPolicyEntity policy : policies) {
            if (policy == null || !StringUtils.hasText(policy.getPolicyKey())) {
                continue;
            }

            String policyKey = policy.getPolicyKey().trim();
            String policyName = requireText(policy.getPolicyName(), "policyName");
            String policyValue = requireText(policy.getPolicyValue(), "policyValue");
            String valueType = requireText(policy.getValueType(), "valueType");

            systemPolicyRepository.findById(policyKey)
                    .map(existing -> {
                        existing.setPolicyName(policyName);
                        existing.setPolicyValue(policyValue);
                        existing.setValueType(valueType);
                        existing.setSortSeq(policy.getSortSeq());
                        existing.setUseYn(policy.isUseYn());
                        existing.setDescription(trimToNull(policy.getDescription()));
                        return existing;
                    })
                    .orElseGet(() -> systemPolicyRepository.save(SystemPolicyEntity.builder()
                            .policyKey(policyKey)
                            .policyName(policyName)
                            .policyValue(policyValue)
                            .valueType(valueType)
                            .sortSeq(policy.getSortSeq())
                            .useYn(policy.isUseYn())
                            .description(trimToNull(policy.getDescription()))
                            .build()));
        }

        return findPolicies();
    }

    private static String requireText(String value, String field) {
        if (!StringUtils.hasText(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
        }
        return value.trim();
    }

    private static String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
