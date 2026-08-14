package com.cheil.cheil_be.adapter.out.persistence.certification;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

interface JpaCertificationRepository extends JpaRepository<CertificationEntity, String> {
    List<CertificationEntity> findByCertKind(int certKind);
}
