package com.cheil.cheil_be.application.certification.port.in;

import java.util.List;

import com.cheil.cheil_be.domain.certification.Certification;

public interface CertificationUseCase {

    List<Certification> findAll(CertificationSearchCondition condition);

    Certification findByCertCode(String certCode);

    Certification create(CertificationUpsertCommand command);

    Certification update(String certCode, CertificationUpsertCommand command);

    void delete(String certCode);
}
