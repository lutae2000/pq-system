package com.cheil.cheil_be.application.certification.service;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.application.certification.port.in.CertificationSearchCondition;
import com.cheil.cheil_be.application.certification.port.in.CertificationUpsertCommand;
import com.cheil.cheil_be.application.certification.port.out.CertificationRepository;
import com.cheil.cheil_be.common.text.StringValues;
import com.cheil.cheil_be.domain.certification.Certification;

@Service
@RequiredArgsConstructor
public class CertificationAdminService {

    private static final int CERT_CODE_MAX_LENGTH = 20;
    private static final int CERT_NAME_MAX_LENGTH = 200;
    private static final int SATIS_CODE_MAX_LENGTH = 20;
    private static final int SATIS_NAME_MAX_LENGTH = 200;

    private final CertificationRepository certificationRepository;

    @Transactional(readOnly = true)
    public List<Certification> findAll() {
        return findAll(new CertificationSearchCondition(null));
    }

    @Transactional(readOnly = true)
    public List<Certification> findAll(CertificationSearchCondition condition) {
        Integer certKind = condition == null ? null : condition.certKind();
        validateCertKind(certKind);

        return certificationRepository.findAllByCertKind(certKind).stream()
                .sorted((left, right) -> left.certCode().compareToIgnoreCase(right.certCode()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Certification findByCertCode(String certCode) {
        return certificationRepository.findByCertCode(StringValues.required(certCode, "certCode"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "자격증을 찾을 수 없습니다."));
    }

    @Transactional
    public Certification create(CertificationUpsertCommand request) {
        String certCode = StringValues.required(request.certCode(), "certCode");
        if (certificationRepository.existsByCertCode(certCode)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 존재하는 자격증 코드입니다.");
        }

        Certification normalized = normalize(request, certCode);
        return certificationRepository.save(normalized);
    }

    @Transactional
    public Certification update(String certCode, CertificationUpsertCommand request) {
        String normalizedCertCode = StringValues.required(certCode, "certCode");
        certificationRepository.findByCertCode(normalizedCertCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "자격증을 찾을 수 없습니다."));

        String requestCertCode = StringValues.normalize(request.certCode());
        if (!requestCertCode.isBlank() && !normalizedCertCode.equals(requestCertCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "path certCode와 body certCode가 일치해야 합니다.");
        }

        Certification normalized = normalize(request, normalizedCertCode);
        return certificationRepository.save(normalized);
    }

    @Transactional
    public void delete(String certCode) {
        String normalizedCertCode = StringValues.required(certCode, "certCode");
        if (!certificationRepository.existsByCertCode(normalizedCertCode)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "자격증을 찾을 수 없습니다.");
        }
        certificationRepository.deleteByCertCode(normalizedCertCode);
    }

    private Certification normalize(CertificationUpsertCommand request, String certCode) {
        String certName = StringValues.required(request.certName(), "certName");
        String satisCode = StringValues.normalize(request.satisCode());
        String satisName = StringValues.normalize(request.satisName());
        int certKind = request.certKind() == null ? 0 : request.certKind();
        validateCertKind(certKind);

        StringValues.validateMaxLength(certCode, CERT_CODE_MAX_LENGTH, "certCode");
        StringValues.validateMaxLength(certName, CERT_NAME_MAX_LENGTH, "certName");
        StringValues.validateMaxLength(satisCode, SATIS_CODE_MAX_LENGTH, "satisCode");
        StringValues.validateMaxLength(satisName, SATIS_NAME_MAX_LENGTH, "satisName");

        return new Certification(
                certCode,
                certName,
                certKind,
                satisCode.isBlank() ? null : satisCode,
                satisName.isBlank() ? null : satisName,
                request.useYn() == null || request.useYn(),
                null,
                null,
                null,
                null
        );
    }

    private void validateCertKind(Integer certKind) {
        if (certKind != null && (certKind < 0 || certKind > 4)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "certKind은 0부터 4 사이여야 합니다.");
        }
    }
}
