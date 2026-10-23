package com.cheil.cheil_be.application.certification.service;

import static com.cheil.cheil_be.application.common.exception.ApplicationException.badRequest;
import static com.cheil.cheil_be.application.common.exception.ApplicationException.conflict;
import static com.cheil.cheil_be.application.common.exception.ApplicationException.notFound;
import static com.cheil.cheil_be.application.common.validation.InputValues.integerRange;
import static com.cheil.cheil_be.application.common.validation.InputValues.requireNonNull;
import static com.cheil.cheil_be.application.common.validation.InputValues.requiredText;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.certification.port.in.CertificationSearchCondition;
import com.cheil.cheil_be.application.certification.port.in.CertificationUpsertCommand;
import com.cheil.cheil_be.application.certification.port.in.CertificationUseCase;
import com.cheil.cheil_be.application.certification.port.out.CertificationRepository;
import com.cheil.cheil_be.domain.certification.Certification;

@Service
@RequiredArgsConstructor
public class CertificationAdminService implements CertificationUseCase {

    private final CertificationRepository certificationRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Certification> findAll(CertificationSearchCondition condition) {
        Integer certKind = condition == null ? null : condition.certKind();
        integerRange(certKind, 0, 4, "certKind");

        return certificationRepository.findAllByCertKind(certKind).stream()
                .sorted((left, right) -> left.certCode().compareToIgnoreCase(right.certCode()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Certification findByCertCode(String certCode) {
        return certificationRepository.findByCertCode(requiredText(certCode, "certCode"))
                .orElseThrow(() -> notFound("자격증을 찾을 수 없습니다."));
    }

    @Override
    @Transactional
    public Certification create(CertificationUpsertCommand request) {
        requireNonNull(request, "요청 본문은 필수입니다.");
        String certCode = requiredText(request.certCode(), "certCode");
        if (certificationRepository.existsByCertCode(certCode)) {
            throw conflict("이미 존재하는 자격증 코드입니다.");
        }

        return certificationRepository.save(request.toDomain(certCode));
    }

    @Override
    @Transactional
    public Certification update(String certCode, CertificationUpsertCommand request) {
        requireNonNull(request, "요청 본문은 필수입니다.");
        String normalizedCertCode = requiredText(certCode, "certCode");
        certificationRepository.findByCertCode(normalizedCertCode)
                .orElseThrow(() -> notFound("자격증을 찾을 수 없습니다."));

        String requestCertCode = request.certCode();
        if (requestCertCode != null && !normalizedCertCode.equals(requestCertCode)) {
            throw badRequest("path certCode와 body certCode가 일치해야 합니다.");
        }

        return certificationRepository.save(request.toDomain(normalizedCertCode));
    }

    @Override
    @Transactional
    public void delete(String certCode) {
        String normalizedCertCode = requiredText(certCode, "certCode");
        if (!certificationRepository.existsByCertCode(normalizedCertCode)) {
            throw notFound("자격증을 찾을 수 없습니다.");
        }
        certificationRepository.deleteByCertCode(normalizedCertCode);
    }

}
