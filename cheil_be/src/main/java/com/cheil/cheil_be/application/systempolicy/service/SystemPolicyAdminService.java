package com.cheil.cheil_be.application.systempolicy.service;

import java.util.List;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.out.persistence.systempolicy.JpaSystemPolicyRepository;
import com.cheil.cheil_be.adapter.out.persistence.systempolicy.SystemPolicyEntity;

@Service
@Transactional
@RequiredArgsConstructor
public class SystemPolicyAdminService {

    private final JpaSystemPolicyRepository systemPolicyRepository;
    private final SystemPolicyCacheService systemPolicyCacheService;

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
            validatePolicy(policy);

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

        policies.stream()
                .filter(policy -> policy != null && StringUtils.hasText(policy.getPolicyKey()))
                .forEach(policy -> systemPolicyCacheService.refresh(policy.getPolicyKey().trim(), policy));
        return findPolicies();
    }

    public SystemPolicyEntity createPolicy(SystemPolicyEntity policy) {
        String policyKey = requireText(policy.getPolicyKey(), "policyKey");
        if (systemPolicyRepository.existsById(policyKey)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 존재하는 정책 코드입니다.");
        }
        validatePolicy(policy);
        policy.setPolicyKey(policyKey);
        policy.setPolicyName(requireText(policy.getPolicyName(), "policyName"));
        policy.setPolicyValue(requireText(policy.getPolicyValue(), "policyValue"));
        policy.setValueType(requireText(policy.getValueType(), "valueType"));
        SystemPolicyEntity saved = systemPolicyRepository.save(policy);
        systemPolicyCacheService.refresh(policyKey, saved);
        return saved;
    }

    public SystemPolicyEntity updatePolicy(String policyKey, SystemPolicyEntity policy) {
        String normalizedKey = requireText(policyKey, "policyKey");
        SystemPolicyEntity existing = systemPolicyRepository.findById(normalizedKey)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "정책을 찾을 수 없습니다."));
        validatePolicy(policy);
        existing.setPolicyName(requireText(policy.getPolicyName(), "policyName"));
        existing.setPolicyValue(requireText(policy.getPolicyValue(), "policyValue"));
        existing.setValueType(requireText(policy.getValueType(), "valueType"));
        existing.setSortSeq(policy.getSortSeq());
        existing.setUseYn(policy.isUseYn());
        existing.setDescription(trimToNull(policy.getDescription()));
        systemPolicyCacheService.refresh(normalizedKey, existing);
        return existing;
    }

    @Transactional(readOnly = true)
    public Optional<SystemPolicyEntity> findEnabledPolicy(String policyKey) {
        return systemPolicyRepository.findById(policyKey).filter(SystemPolicyEntity::isUseYn);
    }

    public SystemPolicyEntity upsertTextPolicy(
            String policyKey,
            String policyName,
            String policyValue,
            int sortSeq,
            String description
    ) {
        String normalizedKey = requireText(policyKey, "policyKey");
        SystemPolicyEntity policy = systemPolicyRepository.findById(normalizedKey)
                .orElseGet(() -> SystemPolicyEntity.builder().policyKey(normalizedKey).build());
        policy.setPolicyName(requireText(policyName, "policyName"));
        policy.setPolicyValue(requireText(policyValue, "policyValue"));
        policy.setValueType("TEXT");
        policy.setSortSeq(sortSeq);
        policy.setUseYn(true);
        policy.setDescription(trimToNull(description));
        SystemPolicyEntity saved = systemPolicyRepository.save(policy);
        systemPolicyCacheService.refresh(normalizedKey, saved);
        return saved;
    }

    private static void validatePolicy(SystemPolicyEntity policy) {
        if (policy == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "policy is required");
        }
        if (policy.isUseYn() && !StringUtils.hasText(policy.getPolicyValue())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "활성화된 정책의 설정값은 필수입니다.");
        }
        if ("NUMBER".equalsIgnoreCase(policy.getValueType()) && StringUtils.hasText(policy.getPolicyValue())
                && !policy.getPolicyValue().trim().matches("\\d{1,3}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "숫자 정책의 설정값은 1~3자리 숫자여야 합니다.");
        }
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
