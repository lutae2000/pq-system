package com.cheil.cheil_be.adapter.out.persistence.companyprofile;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyFinancialStatusJpaRepository extends JpaRepository<CompanyFinancialStatusEntity, Long> {

    List<CompanyFinancialStatusEntity> findByProfileIdOrderByFiscalYearDesc(Long profileId);
}
