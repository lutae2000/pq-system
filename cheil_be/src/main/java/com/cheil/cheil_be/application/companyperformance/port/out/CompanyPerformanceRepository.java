package com.cheil.cheil_be.application.companyperformance.port.out;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.cheil.cheil_be.application.companyperformance.port.in.CompanyPerformanceSearchCondition;
import com.cheil.cheil_be.domain.companyperformance.CompanyPerformance;

public interface CompanyPerformanceRepository {

    Page<CompanyPerformance> findAll(CompanyPerformanceSearchCondition condition, Pageable pageable);

    Optional<CompanyPerformance> findById(Long seq);

    CompanyPerformance save(CompanyPerformance companyPerformance);

    void deleteById(Long seq);
}
