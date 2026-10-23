package com.cheil.cheil_be.adapter.out.persistence.companyprofile;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import com.cheil.cheil_be.application.companyprofile.port.in.CompanyProfileUseCase;
import com.cheil.cheil_be.application.companyprofile.port.out.CompanyProfileRepository;
import com.cheil.cheil_be.common.security.AuditActorResolver;
import com.google.gson.Gson;

@Repository
@RequiredArgsConstructor
public class CompanyProfileRepositoryAdapter implements CompanyProfileRepository {

    private static final long PROFILE_ID = 1L;

    private final CompanyProfileJpaRepository profileRepository;
    private final CompanyFinancialStatusJpaRepository financialStatusRepository;
    private final CompanyAttachmentJpaRepository attachmentRepository;
    private final CompanyProfileHistJpaRepository historyRepository;
    private final Gson gson = new Gson();

    @Override
    public CompanyProfileUseCase.Detail findDetail() {
        return detail(profileRepository.findById(PROFILE_ID).orElseGet(CompanyProfileEntity::empty));
    }

    @Override
    public CompanyProfileUseCase.Detail update(CompanyProfileUseCase.ProfileCommand command) {
        CompanyProfileEntity profile = profileRepository.findById(PROFILE_ID).orElseGet(CompanyProfileEntity::empty);
        if (profileRepository.existsById(PROFILE_ID)) {
            historyRepository.save(CompanyProfileHistEntity.create(
                    PROFILE_ID, AuditActorResolver.resolve(), "UPDATE", "회사 기초정보 수정",
                    gson.toJson(profile.snapshot())
            ));
        }
        profile.update(
                command.companyName(), command.businessRegistrationNo(), command.corporateRegistrationNo(),
                command.representativeName(), command.establishedOn(), command.postalCode(), command.address(),
                command.addressDetail(), command.phoneNo(), command.faxNo(), command.homepageUrl(),
                command.businessType(), command.businessItem(), command.mainBusiness(), command.memo()
        );
        return detail(profileRepository.save(profile));
    }

    @Override
    public CompanyProfileUseCase.FinancialStatus addFinancialStatus(CompanyProfileUseCase.FinancialStatusCommand command) {
        return toModel(financialStatusRepository.save(CompanyFinancialStatusEntity.create(
                command.fiscalYear(), command.capitalAmountMillion(), command.salesAmountMillion(),
                command.debtRatio(), command.currentRatio(), command.creditRating(),
                command.registeredOn(), command.note()
        )));
    }

    @Override
    public boolean existsFinancialStatus(Long financialId) {
        return financialStatusRepository.existsById(financialId);
    }

    @Override
    public void deleteFinancialStatus(Long financialId) {
        financialStatusRepository.deleteById(financialId);
    }

    @Override
    public CompanyProfileUseCase.Attachment addAttachment(CompanyProfileUseCase.AttachmentCommand command) {
        return toModel(attachmentRepository.save(CompanyAttachmentEntity.create(
                command.attachmentType(), command.title(), command.fiscalYear(), command.issuedOn(),
                command.validUntil(), command.fileId(), command.originalFilename(), command.contentType(),
                command.fileSize(), command.downloadUrl(), command.note()
        )));
    }

    @Override
    public boolean existsAttachment(Long attachmentId) {
        return attachmentRepository.existsById(attachmentId);
    }

    @Override
    public void deleteAttachment(Long attachmentId) {
        attachmentRepository.deleteById(attachmentId);
    }

    private CompanyProfileUseCase.Detail detail(CompanyProfileEntity profile) {
        return new CompanyProfileUseCase.Detail(
                toModel(profile),
                financialStatusRepository.findByProfileIdOrderByFiscalYearDesc(PROFILE_ID).stream()
                        .map(CompanyProfileRepositoryAdapter::toModel).toList(),
                attachmentRepository.findByProfileIdOrderByCreatedAtDesc(PROFILE_ID).stream()
                        .map(CompanyProfileRepositoryAdapter::toModel).toList(),
                historyRepository.findByProfileIdOrderByChangedAtDesc(PROFILE_ID).stream()
                        .map(CompanyProfileRepositoryAdapter::toModel).toList()
        );
    }

    private static CompanyProfileUseCase.Profile toModel(CompanyProfileEntity entity) {
        return new CompanyProfileUseCase.Profile(
                entity.getProfileId(), entity.getCompanyName(), entity.getBusinessRegistrationNo(),
                entity.getCorporateRegistrationNo(), entity.getRepresentativeName(), entity.getEstablishedOn(),
                entity.getPostalCode(), entity.getAddress(), entity.getAddressDetail(), entity.getPhoneNo(),
                entity.getFaxNo(), entity.getHomepageUrl(), entity.getBusinessType(), entity.getBusinessItem(),
                entity.getMainBusiness(), entity.getMemo(), entity.getCreatedAt(), entity.getCreatedId(),
                entity.getLastChangedAt(), entity.getLastChangedId()
        );
    }

    private static CompanyProfileUseCase.FinancialStatus toModel(CompanyFinancialStatusEntity entity) {
        return new CompanyProfileUseCase.FinancialStatus(
                entity.getFinancialId(), entity.getFiscalYear(), entity.getCapitalAmountMillion(),
                entity.getSalesAmountMillion(), entity.getDebtRatio(), entity.getCurrentRatio(),
                entity.getCreditRating(), entity.getRegisteredOn(), entity.getNote(),
                entity.getCreatedAt(), entity.getCreatedId()
        );
    }

    private static CompanyProfileUseCase.Attachment toModel(CompanyAttachmentEntity entity) {
        return new CompanyProfileUseCase.Attachment(
                entity.getAttachmentId(), entity.getAttachmentType(), entity.getTitle(), entity.getFiscalYear(),
                entity.getIssuedOn(), entity.getValidUntil(), entity.getFileId(), entity.getOriginalFilename(),
                entity.getContentType(), entity.getFileSize(), entity.getDownloadUrl(), entity.getNote(),
                entity.getCreatedAt(), entity.getCreatedId()
        );
    }

    private static CompanyProfileUseCase.History toModel(CompanyProfileHistEntity entity) {
        return new CompanyProfileUseCase.History(
                entity.getHistId(), entity.getChangedAt(), entity.getChangedBy(), entity.getChangeType(),
                entity.getChangeSummary(), entity.getSnapshotJson()
        );
    }
}
