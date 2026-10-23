package com.cheil.cheil_be.application.companyprofile.port.out;

import com.cheil.cheil_be.application.companyprofile.port.in.CompanyProfileUseCase;

public interface CompanyProfileRepository {

    CompanyProfileUseCase.Detail findDetail();

    CompanyProfileUseCase.Detail update(CompanyProfileUseCase.ProfileCommand command);

    CompanyProfileUseCase.FinancialStatus addFinancialStatus(CompanyProfileUseCase.FinancialStatusCommand command);

    boolean existsFinancialStatus(Long financialId);

    void deleteFinancialStatus(Long financialId);

    CompanyProfileUseCase.Attachment addAttachment(CompanyProfileUseCase.AttachmentCommand command);

    boolean existsAttachment(Long attachmentId);

    void deleteAttachment(Long attachmentId);
}
