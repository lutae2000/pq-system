package com.cheil.cheil_be.application.companyprofile.port.in;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.cheil.cheil_be.application.common.validation.InputValues;
import com.cheil.cheil_be.common.text.StringValues;

public interface CompanyProfileUseCase {

    Detail get();

    Detail update(ProfileCommand command);

    FinancialStatus addFinancialStatus(FinancialStatusCommand command);

    void deleteFinancialStatus(Long financialId);

    Attachment addAttachment(AttachmentCommand command);

    void deleteAttachment(Long attachmentId);

    record Detail(Profile profile, List<FinancialStatus> financialStatuses,
                  List<Attachment> attachments, List<History> histories) {
    }

    record Profile(Long profileId, String companyName, String businessRegistrationNo,
                   String corporateRegistrationNo, String representativeName, LocalDate establishedOn,
                   String postalCode, String address, String addressDetail, String phoneNo, String faxNo,
                   String homepageUrl, String businessType, String businessItem, String mainBusiness,
                   String memo, Instant createdAt, String createdId, Instant lastChangedAt,
                   String lastChangedId) {
    }

    record FinancialStatus(Long financialId, Integer fiscalYear, BigDecimal capitalAmountMillion,
                           BigDecimal salesAmountMillion, BigDecimal debtRatio, BigDecimal currentRatio,
                           String creditRating, LocalDate registeredOn, String note,
                           Instant createdAt, String createdId) {
    }

    record Attachment(Long attachmentId, String attachmentType, String title, Integer fiscalYear,
                      LocalDate issuedOn, LocalDate validUntil, String fileId, String originalFilename,
                      String contentType, Long fileSize, String downloadUrl, String note,
                      Instant createdAt, String createdId) {
    }

    record History(Long histId, Instant changedAt, String changedBy, String changeType,
                   String changeSummary, String snapshotJson) {
    }

    record ProfileCommand(String companyName, String businessRegistrationNo,
                          String corporateRegistrationNo, String representativeName, LocalDate establishedOn,
                          String postalCode, String address, String addressDetail, String phoneNo, String faxNo,
                          String homepageUrl, String businessType, String businessItem, String mainBusiness,
                          String memo) {
        public ProfileCommand {
            companyName = InputValues.requiredText(companyName, "companyName");
            businessRegistrationNo = StringValues.trimToNull(businessRegistrationNo);
            corporateRegistrationNo = StringValues.trimToNull(corporateRegistrationNo);
            representativeName = StringValues.trimToNull(representativeName);
            postalCode = StringValues.trimToNull(postalCode);
            address = StringValues.trimToNull(address);
            addressDetail = StringValues.trimToNull(addressDetail);
            phoneNo = StringValues.trimToNull(phoneNo);
            faxNo = StringValues.trimToNull(faxNo);
            homepageUrl = StringValues.trimToNull(homepageUrl);
            businessType = StringValues.trimToNull(businessType);
            businessItem = StringValues.trimToNull(businessItem);
            mainBusiness = StringValues.trimToNull(mainBusiness);
            memo = StringValues.trimToNull(memo);
        }
    }

    record FinancialStatusCommand(Integer fiscalYear, BigDecimal capitalAmountMillion,
                                  BigDecimal salesAmountMillion, BigDecimal debtRatio,
                                  BigDecimal currentRatio, String creditRating,
                                  LocalDate registeredOn, String note) {
        public FinancialStatusCommand {
            if (fiscalYear == null) {
                throw com.cheil.cheil_be.application.common.exception.ApplicationException.badRequest(
                        "fiscalYear은(는) 필수입니다.");
            }
            creditRating = StringValues.trimToNull(creditRating);
            note = StringValues.trimToNull(note);
        }
    }

    record AttachmentCommand(String attachmentType, String title, Integer fiscalYear,
                             LocalDate issuedOn, LocalDate validUntil, String fileId,
                             String originalFilename, String contentType, Long fileSize,
                             String downloadUrl, String note) {
        public AttachmentCommand {
            attachmentType = InputValues.requiredText(attachmentType, "attachmentType");
            title = InputValues.requiredText(title, "title");
            fileId = InputValues.requiredText(fileId, "fileId");
            originalFilename = InputValues.requiredText(originalFilename, "originalFilename");
            contentType = StringValues.trimToNull(contentType);
            fileSize = fileSize == null ? 0L : fileSize;
            downloadUrl = InputValues.requiredText(downloadUrl, "downloadUrl");
            note = StringValues.trimToNull(note);
        }
    }
}
