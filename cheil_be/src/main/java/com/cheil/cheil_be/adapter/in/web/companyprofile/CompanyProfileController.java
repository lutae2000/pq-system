package com.cheil.cheil_be.adapter.in.web.companyprofile;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.adapter.out.persistence.companyprofile.CompanyProfileAdminService;

@RestController
@RequestMapping("/system/company-profile")
@RequiredArgsConstructor
public class CompanyProfileController {

    private final CompanyProfileAdminService companyProfileAdminService;

    /**
     * 회사 기본정보와 부가정보를 함께 조회한다.
     */
    @GetMapping
    public ResponseEntity<CompanyProfileDetailResponse> get() {
        return ResponseEntity.ok(detailResponse());
    }

    /**
     * 회사 기본정보를 수정한다.
     */
    @PutMapping
    public ResponseEntity<CompanyProfileDetailResponse> updateProfile(@RequestBody CompanyProfileRequest request) {
        companyProfileAdminService.updateProfile(request);
        return ResponseEntity.ok(detailResponse());
    }

    /**
     * 재무상태 항목을 추가한다.
     */
    @PostMapping("/financial-statuses")
    public ResponseEntity<CompanyFinancialStatusResponse> addFinancialStatus(@RequestBody CompanyFinancialStatusRequest request) {
        return ResponseEntity.ok(CompanyFinancialStatusResponse.from(companyProfileAdminService.addFinancialStatus(request)));
    }

    /**
     * 재무상태 항목을 삭제한다.
     */
    @DeleteMapping("/financial-statuses/{financialId}")
    public ResponseEntity<Void> deleteFinancialStatus(@PathVariable Long financialId) {
        companyProfileAdminService.deleteFinancialStatus(financialId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 첨부파일 정보를 추가한다.
     */
    @PostMapping("/attachments")
    public ResponseEntity<CompanyAttachmentResponse> addAttachment(@RequestBody CompanyAttachmentRequest request) {
        return ResponseEntity.ok(CompanyAttachmentResponse.from(companyProfileAdminService.addAttachment(request)));
    }

    /**
     * 첨부파일 정보를 삭제한다.
     */
    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long attachmentId) {
        companyProfileAdminService.deleteAttachment(attachmentId);
        return ResponseEntity.noContent().build();
    }

    private CompanyProfileDetailResponse detailResponse() {
        return new CompanyProfileDetailResponse(
                CompanyProfileResponse.from(companyProfileAdminService.getProfile()),
                companyProfileAdminService.getFinancialStatuses().stream().map(CompanyFinancialStatusResponse::from).toList(),
                companyProfileAdminService.getAttachments().stream().map(CompanyAttachmentResponse::from).toList(),
                companyProfileAdminService.getHistories().stream().map(CompanyProfileHistoryResponse::from).toList()
        );
    }
}
