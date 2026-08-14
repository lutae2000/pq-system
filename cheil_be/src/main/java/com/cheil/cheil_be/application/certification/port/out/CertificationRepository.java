package com.cheil.cheil_be.application.certification.port.out;

import java.util.List;
import java.util.Optional;

import com.cheil.cheil_be.domain.certification.Certification;

public interface CertificationRepository {
    List<Certification> findAll();

    List<Certification> findAllByCertKind(Integer certKind);

    Optional<Certification> findByCertCode(String certCode);

    boolean existsByCertCode(String certCode);

    Certification save(Certification certification);

    void deleteByCertCode(String certCode);
}
