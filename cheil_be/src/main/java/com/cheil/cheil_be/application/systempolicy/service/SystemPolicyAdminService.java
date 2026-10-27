package com.cheil.cheil_be.application.systempolicy.service;

import static com.cheil.cheil_be.application.common.validation.InputValues.requireText;
import static com.cheil.cheil_be.common.text.StringValues.trimToNull;

import java.util.List;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.systempolicy.model.BrandingPolicyKeys;
import com.cheil.cheil_be.application.systempolicy.model.SystemPolicy;
import com.cheil.cheil_be.application.systempolicy.port.in.SystemPolicyAdminUseCase;
import com.cheil.cheil_be.application.systempolicy.port.out.SystemPolicyRepository;

@Service
@Transactional
@RequiredArgsConstructor
public class SystemPolicyAdminService implements SystemPolicyAdminUseCase {

    private final SystemPolicyRepository repository;
    private final SystemPolicyCacheService cacheService;
    private final BrandingSettingsCacheService brandingSettingsCacheService;

    @Override
    @Transactional(readOnly = true)
    public List<SystemPolicy> findPolicies() {
        return repository.findAll();
    }

    @Override
    public List<SystemPolicy> savePolicies(List<SystemPolicy> policies) {
        if (policies == null) {
            throw ApplicationException.badRequest("policy list is required");
        }
        policies.forEach(policy -> save(policy, false));
        return findPolicies();
    }

    @Override
    public SystemPolicy createPolicy(SystemPolicy policy) {
        return save(policy, true);
    }

    @Override
    public SystemPolicy updatePolicy(String policyKey, SystemPolicy policy) {
        String key = requireText(policyKey, "policyKey is required");
        if (!repository.existsByKey(key)) {
            throw ApplicationException.notFound("정책을 찾을 수 없습니다.");
        }
        return save(withKey(policy, key), false);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SystemPolicy> findEnabledPolicy(String policyKey) {
        return repository.findByKey(policyKey).filter(SystemPolicy::useYn);
    }

    @Override
    public SystemPolicy upsertTextPolicy(
            String policyKey,
            String policyName,
            String policyValue,
            int sortSeq,
            String description
    ) {
        return save(new SystemPolicy(
                requireText(policyKey, "policyKey is required"), policyName, policyValue,
                "TEXT", sortSeq, true, description
        ), false);
    }

    private SystemPolicy save(SystemPolicy policy, boolean createOnly) {
        SystemPolicy normalized = normalize(policy);
        if (createOnly && repository.existsByKey(normalized.policyKey())) {
            throw ApplicationException.conflict("이미 존재하는 정책 코드입니다.");
        }
        SystemPolicy saved = repository.save(normalized);
        cacheService.refresh(saved.policyKey(), saved);
        if (BrandingPolicyKeys.contains(saved.policyKey())) {
            brandingSettingsCacheService.evict();
        }
        return saved;
    }

    private static SystemPolicy normalize(SystemPolicy policy) {
        if (policy == null) {
            throw ApplicationException.badRequest("policy is required");
        }
        String key = requireText(policy.policyKey(), "policyKey is required");
        String name = requireText(policy.policyName(), "policyName is required");
        String value = requireText(policy.policyValue(), "policyValue is required");
        String type = requireText(policy.valueType(), "valueType is required");
        if ("NUMBER".equalsIgnoreCase(type) && !value.matches("\\d{1,3}")) {
            throw ApplicationException.badRequest("숫자 정책의 설정값은 1~3자리 숫자여야 합니다.");
        }
        return new SystemPolicy(key, name, value, type, policy.sortSeq(), policy.useYn(), trimToNull(policy.description()));
    }

    private static SystemPolicy withKey(SystemPolicy policy, String policyKey) {
        if (policy == null) {
            throw ApplicationException.badRequest("policy is required");
        }
        return new SystemPolicy(policyKey, policy.policyName(), policy.policyValue(), policy.valueType(),
                policy.sortSeq(), policy.useYn(), policy.description());
    }
}
