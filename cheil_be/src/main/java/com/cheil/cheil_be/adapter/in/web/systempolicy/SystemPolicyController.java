package com.cheil.cheil_be.adapter.in.web.systempolicy;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import com.cheil.cheil_be.adapter.out.persistence.systempolicy.SystemPolicyEntity;
import com.cheil.cheil_be.application.systempolicy.service.SystemPolicyAdminService;
import com.cheil.cheil_be.application.systempolicy.service.BrandingAssetService;

@RestController
@RequestMapping("/system/policies")
@RequiredArgsConstructor
public class SystemPolicyController {

    private final SystemPolicyAdminService systemPolicyAdminService;
    private final BrandingAssetService brandingAssetService;

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

    @PatchMapping(value = "/branding/{assetType}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BrandingAssetService.BrandingSettings> uploadBrandingImage(
            @PathVariable String assetType,
            @RequestPart("file") MultipartFile file
    ) {
        return ResponseEntity.ok(brandingAssetService.upload(assetType, file));
    }

    @PatchMapping("/branding/{assetType}/default")
    public ResponseEntity<BrandingAssetService.BrandingSettings> applyDefaultBrandingImage(
            @PathVariable String assetType
    ) {
        return ResponseEntity.ok(brandingAssetService.applyDefault(assetType));
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
