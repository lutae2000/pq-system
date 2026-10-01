package com.cheil.cheil_be.application.systempolicy.service;

import java.util.List;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.cheil.cheil_be.adapter.out.persistence.systempolicy.JpaSystemPolicyRepository;
import com.cheil.cheil_be.adapter.out.persistence.systempolicy.SystemPolicyEntity;
import com.cheil.cheil_be.application.systempolicy.exception.SystemPolicyApplicationException;
import com.cheil.cheil_be.application.systempolicy.exception.SystemPolicyApplicationException.Type;

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
            throw new SystemPolicyApplicationException(Type.BAD_REQUEST, "policy list is required");
        }

        for (SystemPolicyEntity policy : policies) {
            if (policy == null) {
                throw new SystemPolicyApplicationException(Type.BAD_REQUEST, "policy is required");
            }
            if (!StringUtils.hasText(policy.getPolicyKey())) {
                throw new SystemPolicyApplicationException(Type.BAD_REQUEST, "policyKey is required");
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

        List<SystemPolicyEntity> savedPolicies = findPolicies();
        // 요청 객체에는 공백과 원본 값이 남아 있을 수 있으므로 DB에서 다시 읽은 값을 캐시에 넣는다.
        // 그래야 화면에 보낸 값과 실제 저장된 값이 다를 때도 다음 조회가 일관된다.
        policies.stream()
                .map(SystemPolicyEntity::getPolicyKey)
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .forEach(policyKey -> savedPolicies.stream()
                        .filter(saved -> policyKey.equals(saved.getPolicyKey()))
                        .findFirst()
                        .ifPresent(saved -> systemPolicyCacheService.refresh(policyKey, saved)));
        return savedPolicies;
    }

    public SystemPolicyEntity createPolicy(SystemPolicyEntity policy) {
        if (policy == null) {
            throw new SystemPolicyApplicationException(Type.BAD_REQUEST, "policy is required");
        }
        String policyKey = requireText(policy.getPolicyKey(), "policyKey");
        if (systemPolicyRepository.existsById(policyKey)) {
            throw new SystemPolicyApplicationException(Type.CONFLICT, "이미 존재하는 정책 코드입니다.");
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
        if (policy == null) {
            throw new SystemPolicyApplicationException(Type.BAD_REQUEST, "policy is required");
        }
        SystemPolicyEntity existing = systemPolicyRepository.findById(normalizedKey)
                .orElseThrow(() -> new SystemPolicyApplicationException(Type.NOT_FOUND, "정책을 찾을 수 없습니다."));
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
            throw new SystemPolicyApplicationException(Type.BAD_REQUEST, "policy is required");
        }
        if (policy.isUseYn() && !StringUtils.hasText(policy.getPolicyValue())) {
            throw new SystemPolicyApplicationException(Type.BAD_REQUEST, "활성화된 정책의 설정값은 필수입니다.");
        }
        if ("NUMBER".equalsIgnoreCase(policy.getValueType()) && StringUtils.hasText(policy.getPolicyValue())
                && !policy.getPolicyValue().trim().matches("\\d{1,3}")) {
            throw new SystemPolicyApplicationException(Type.BAD_REQUEST, "숫자 정책의 설정값은 1~3자리 숫자여야 합니다.");
        }
    }

    private static String requireText(String value, String field) {
        if (!StringUtils.hasText(value)) {
            throw new SystemPolicyApplicationException(Type.BAD_REQUEST, field + " is required");
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
