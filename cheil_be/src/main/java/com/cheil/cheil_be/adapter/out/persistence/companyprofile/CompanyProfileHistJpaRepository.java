package com.cheil.cheil_be.adapter.out.persistence.companyprofile;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyProfileHistJpaRepository extends JpaRepository<CompanyProfileHistEntity, Long> {

    List<CompanyProfileHistEntity> findByProfileIdOrderByChangedAtDesc(Long profileId);
}
