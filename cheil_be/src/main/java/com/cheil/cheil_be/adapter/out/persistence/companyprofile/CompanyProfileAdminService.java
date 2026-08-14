package com.cheil.cheil_be.adapter.out.persistence.companyprofile;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.companyprofile.CompanyAttachmentRequest;
import com.cheil.cheil_be.adapter.in.web.companyprofile.CompanyFinancialStatusRequest;
import com.cheil.cheil_be.adapter.in.web.companyprofile.CompanyProfileRequest;
import com.cheil.cheil_be.common.security.AuditActorResolver;
import com.cheil.cheil_be.common.text.StringValues;
import com.google.gson.Gson;

@Service
@RequiredArgsConstructor
public class CompanyProfileAdminService {

    private static final long PROFILE_ID = 1L;

    private final CompanyProfileJpaRepository profileRepository;
    private final CompanyFinancialStatusJpaRepository financialStatusRepository;
    private final CompanyAttachmentJpaRepository attachmentRepository;
    private final CompanyProfileHistJpaRepository histRepository;
    private final Gson gson = new Gson();

    @Transactional(readOnly = true)
    public CompanyProfileEntity getProfile() {
        return profileRepository.findById(PROFILE_ID).orElseGet(CompanyProfileEntity::empty);
    }

    @Transactional(readOnly = true)
    public List<CompanyFinancialStatusEntity> getFinancialStatuses() {
        return financialStatusRepository.findByProfileIdOrderByFiscalYearDesc(PROFILE_ID);
    }

    @Transactional(readOnly = true)
    public List<CompanyAttachmentEntity> getAttachments() {
        return attachmentRepository.findByProfileIdOrderByCreatedAtDesc(PROFILE_ID);
    }

    @Transactional(readOnly = true)
    public List<CompanyProfileHistEntity> getHistories() {
        return histRepository.findByProfileIdOrderByChangedAtDesc(PROFILE_ID);
    }

    @Transactional
    public CompanyProfileEntity updateProfile(CompanyProfileRequest request) {
        CompanyProfileEntity profile = profileRepository.findById(PROFILE_ID).orElseGet(CompanyProfileEntity::empty);

        if (profileRepository.existsById(PROFILE_ID)) {
            histRepository.save(CompanyProfileHistEntity.create(
                    PROFILE_ID,
                    AuditActorResolver.resolve(),
                    "UPDATE",
                    "회사 기초정보 수정",
                    toJson(profile)
            ));
        }

        profile.update(
                StringValues.required(request.companyName(), "companyName"),
                normalize(request.businessRegistrationNo()),
                normalize(request.corporateRegistrationNo()),
                normalize(request.representativeName()),
                request.establishedOn(),
                normalize(request.postalCode()),
                normalize(request.address()),
                normalize(request.addressDetail()),
                normalize(request.phoneNo()),
                normalize(request.faxNo()),
                normalize(request.homepageUrl()),
                normalize(request.businessType()),
                normalize(request.businessItem()),
                normalize(request.mainBusiness()),
                normalize(request.memo())
        );
        return profileRepository.save(profile);
    }

    @Transactional
    public CompanyFinancialStatusEntity addFinancialStatus(CompanyFinancialStatusRequest request) {
        if (request.fiscalYear() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fiscalYear is required.");
        }
        return financialStatusRepository.save(CompanyFinancialStatusEntity.create(
                request.fiscalYear(),
                request.capitalAmountMillion(),
                request.salesAmountMillion(),
                request.debtRatio(),
                request.currentRatio(),
                normalize(request.creditRating()),
                request.registeredOn(),
                normalize(request.note())
        ));
    }

    @Transactional
    public void deleteFinancialStatus(Long financialId) {
        if (!financialStatusRepository.existsById(financialId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Financial status not found.");
        }
        financialStatusRepository.deleteById(financialId);
    }

    @Transactional
    public CompanyAttachmentEntity addAttachment(CompanyAttachmentRequest request) {
        return attachmentRepository.save(CompanyAttachmentEntity.create(
                StringValues.required(request.attachmentType(), "attachmentType"),
                StringValues.required(request.title(), "title"),
                request.fiscalYear(),
                request.issuedOn(),
                request.validUntil(),
                StringValues.required(request.fileId(), "fileId"),
                StringValues.required(request.originalFilename(), "originalFilename"),
                normalize(request.contentType()),
                request.fileSize() == null ? 0L : request.fileSize(),
                StringValues.required(request.downloadUrl(), "downloadUrl"),
                normalize(request.note())
        ));
    }

    @Transactional
    public void deleteAttachment(Long attachmentId) {
        if (!attachmentRepository.existsById(attachmentId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found.");
        }
        attachmentRepository.deleteById(attachmentId);
    }

    private String toJson(CompanyProfileEntity profile) {
        return gson.toJson(profile.snapshot());
    }

    private static String normalize(String value) {
        String normalized = StringValues.normalize(value);
        return normalized.isBlank() ? null : normalized;
    }
}
