package com.cheil.cheil_be.adapter.in.web.companyprofile;

import jakarta.validation.Valid;
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

import com.cheil.cheil_be.application.companyprofile.port.in.CompanyProfileUseCase;

/** 회사 기본정보, 재무현황, 첨부파일을 관리하는 API다. */
@RestController
@RequestMapping("/system/company-profile")
@RequiredArgsConstructor
public class CompanyProfileController {

    private final CompanyProfileUseCase companyProfileUseCase;

    /**
     * 회사 기본정보와 부가정보를 함께 조회한다.
     */
    @GetMapping
    public ResponseEntity<CompanyProfileDetailResponse> get() {
        return ResponseEntity.ok(detailResponse(companyProfileUseCase.get()));
    }

    /**
     * 회사 기본정보를 수정한다.
     */
    @PutMapping
    public ResponseEntity<CompanyProfileDetailResponse> updateProfile(@Valid @RequestBody CompanyProfileRequest request) {
        return ResponseEntity.ok(detailResponse(companyProfileUseCase.update(request.toCommand())));
    }

    /**
     * 재무상태 항목을 추가한다.
     */
    @PostMapping("/financial-statuses")
    public ResponseEntity<CompanyFinancialStatusResponse> addFinancialStatus(@Valid @RequestBody CompanyFinancialStatusRequest request) {
        return ResponseEntity.ok(CompanyFinancialStatusResponse.from(companyProfileUseCase.addFinancialStatus(request.toCommand())));
    }

    /**
     * 재무상태 항목을 삭제한다.
     */
    @DeleteMapping("/financial-statuses/{financialId}")
    public ResponseEntity<Void> deleteFinancialStatus(@PathVariable Long financialId) {
        companyProfileUseCase.deleteFinancialStatus(financialId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 첨부파일 정보를 추가한다.
     */
    @PostMapping("/attachments")
    public ResponseEntity<CompanyAttachmentResponse> addAttachment(@Valid @RequestBody CompanyAttachmentRequest request) {
        return ResponseEntity.ok(CompanyAttachmentResponse.from(companyProfileUseCase.addAttachment(request.toCommand())));
    }

    /**
     * 첨부파일 정보를 삭제한다.
     */
    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long attachmentId) {
        companyProfileUseCase.deleteAttachment(attachmentId);
        return ResponseEntity.noContent().build();
    }

    private static CompanyProfileDetailResponse detailResponse(CompanyProfileUseCase.Detail detail) {
        return new CompanyProfileDetailResponse(
                CompanyProfileResponse.from(detail.profile()),
                detail.financialStatuses().stream().map(CompanyFinancialStatusResponse::from).toList(),
                detail.attachments().stream().map(CompanyAttachmentResponse::from).toList(),
                detail.histories().stream().map(CompanyProfileHistoryResponse::from).toList()
        );
    }
}
