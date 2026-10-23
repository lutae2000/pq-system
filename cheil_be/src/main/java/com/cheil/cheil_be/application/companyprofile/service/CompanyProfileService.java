package com.cheil.cheil_be.application.companyprofile.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.common.validation.InputValues;
import com.cheil.cheil_be.application.companyprofile.port.in.CompanyProfileUseCase;
import com.cheil.cheil_be.application.companyprofile.port.out.CompanyProfileRepository;

@Service
@RequiredArgsConstructor
public class CompanyProfileService implements CompanyProfileUseCase {

    private final CompanyProfileRepository repository;

    @Override
    @Transactional(readOnly = true)
    public Detail get() {
        return repository.findDetail();
    }

    @Override
    @Transactional
    public Detail update(ProfileCommand command) {
        return repository.update(InputValues.requireNonNull(command, "요청 본문은 필수입니다."));
    }

    @Override
    @Transactional
    public FinancialStatus addFinancialStatus(FinancialStatusCommand command) {
        return repository.addFinancialStatus(InputValues.requireNonNull(command, "요청 본문은 필수입니다."));
    }

    @Override
    @Transactional
    public void deleteFinancialStatus(Long financialId) {
        if (!repository.existsFinancialStatus(financialId)) {
            throw ApplicationException.notFound("재무상태 정보를 찾을 수 없습니다.");
        }
        repository.deleteFinancialStatus(financialId);
    }

    @Override
    @Transactional
    public Attachment addAttachment(AttachmentCommand command) {
        return repository.addAttachment(InputValues.requireNonNull(command, "요청 본문은 필수입니다."));
    }

    @Override
    @Transactional
    public void deleteAttachment(Long attachmentId) {
        if (!repository.existsAttachment(attachmentId)) {
            throw ApplicationException.notFound("첨부파일 정보를 찾을 수 없습니다.");
        }
        repository.deleteAttachment(attachmentId);
    }
}
