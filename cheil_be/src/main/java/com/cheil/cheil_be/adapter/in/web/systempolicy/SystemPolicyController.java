package com.cheil.cheil_be.adapter.in.web.systempolicy;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.adapter.out.persistence.systempolicy.SystemPolicyEntity;
import com.cheil.cheil_be.application.systempolicy.service.SystemPolicyAdminService;

@RestController
@RequestMapping("/system/policies")
@RequiredArgsConstructor
public class SystemPolicyController {

    private final SystemPolicyAdminService systemPolicyAdminService;

    /**
     * 시스템 정책 목록을 조회한다.
     */
    @GetMapping
    public ResponseEntity<List<SystemPolicyResponse>> listPolicies() {
        return ResponseEntity.ok(systemPolicyAdminService.findPolicies().stream().map(SystemPolicyResponse::from).toList());
    }

    /**
     * 시스템 정책을 일괄 저장한다.
     */
    @PutMapping
    public ResponseEntity<List<SystemPolicyResponse>> savePolicies(@RequestBody PolicyUpsertRequest request) {
        return ResponseEntity.ok(systemPolicyAdminService.savePolicies(request.items().stream()
                        .map(SystemPolicyUpsertItem::toEntity)
                        .toList())
                .stream()
                .map(SystemPolicyResponse::from)
                .toList());
    }

    @PostMapping
    public ResponseEntity<SystemPolicyResponse> createPolicy(@RequestBody SystemPolicyUpsertItem request) {
        return ResponseEntity.ok(SystemPolicyResponse.from(systemPolicyAdminService.createPolicy(request.toEntity())));
    }

    @PatchMapping("/{policyKey}")
    public ResponseEntity<SystemPolicyResponse> updatePolicy(
            @PathVariable String policyKey,
            @RequestBody SystemPolicyUpsertItem request
    ) {
        return ResponseEntity.ok(SystemPolicyResponse.from(systemPolicyAdminService.updatePolicy(policyKey, request.toEntity())));
    }

    public record PolicyUpsertRequest(List<SystemPolicyUpsertItem> items) {
    }

    public record SystemPolicyUpsertItem(
            String policyKey,
            String policyName,
            String policyValue,
            String valueType,
            Integer sortSeq,
            Boolean useYn,
            String description
    ) {
        SystemPolicyEntity toEntity() {
            return SystemPolicyEntity.builder()
                    .policyKey(policyKey)
                    .policyName(policyName)
                    .policyValue(policyValue)
                    .valueType(valueType)
                    .sortSeq(sortSeq == null ? 0 : sortSeq)
                    .useYn(useYn == null || useYn)
                    .description(description)
                    .build();
        }
    }

    public record SystemPolicyResponse(
            String policyKey,
            String policyName,
            String policyValue,
            String valueType,
            int sortSeq,
            boolean useYn,
            String description
    ) {
        static SystemPolicyResponse from(SystemPolicyEntity entity) {
            return new SystemPolicyResponse(
                    entity.getPolicyKey(),
                    entity.getPolicyName(),
                    entity.getPolicyValue(),
                    entity.getValueType(),
                    entity.getSortSeq(),
                    entity.isUseYn(),
                    entity.getDescription()
            );
        }
    }
}
