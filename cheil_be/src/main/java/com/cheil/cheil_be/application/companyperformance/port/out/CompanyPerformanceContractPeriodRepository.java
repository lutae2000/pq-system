package com.cheil.cheil_be.application.companyperformance.port.out;

import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceContractPeriodRequest;
import org.springframework.data.domain.Page;

import java.util.List;

public interface CompanyPerformanceContractPeriodRepository {
    List<Record> findByPerformanceSeq(Long seq);
    Record findById(Long seq, Long id);
    Long create(Long seq, CompanyPerformanceContractPeriodRequest request);
    int update(Long seq, Long id, CompanyPerformanceContractPeriodRequest request);
    int delete(Long seq, Long id);
    record Record(Long id, Long seq, String contractFromDate, String contractToDate, Integer sortSeq) {}
}
