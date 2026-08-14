package com.cheil.cheil_be.adapter.out.persistence.certification;

import java.util.List;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.certification.port.out.CertificationRepository;
import com.cheil.cheil_be.domain.certification.Certification;

@Repository
@RequiredArgsConstructor
public class CertificationJpaRepository implements CertificationRepository {

    private final JpaCertificationRepository jpaCertificationRepository;

    @Override
    public List<Certification> findAll() {
        return jpaCertificationRepository.findAll().stream()
                .map(CertificationEntity::toDomain)
                .toList();
    }

    @Override
    public List<Certification> findAllByCertKind(Integer certKind) {
        if (certKind == null) {
            return findAll();
        }

        return jpaCertificationRepository.findByCertKind(certKind).stream()
                .map(CertificationEntity::toDomain)
                .toList();
    }

    @Override
    public Optional<Certification> findByCertCode(String certCode) {
        return jpaCertificationRepository.findById(certCode).map(CertificationEntity::toDomain);
    }

    @Override
    public boolean existsByCertCode(String certCode) {
        return jpaCertificationRepository.existsById(certCode);
    }

    @Override
    @Transactional
    public Certification save(Certification certification) {
        return jpaCertificationRepository.findById(certification.certCode())
                .map(existing -> {
                    existing.updateFrom(certification);
                    return jpaCertificationRepository.save(existing).toDomain();
                })
                .orElseGet(() -> jpaCertificationRepository.save(CertificationEntity.from(certification)).toDomain());
    }

    @Override
    @Transactional
    public void deleteByCertCode(String certCode) {
        jpaCertificationRepository.deleteById(certCode);
    }
}
