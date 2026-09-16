package com.cheil.cheil_be.application.companyperformance.port.out;

import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceConstructionKindRequest;
import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceConstructionKindResponse;

import java.util.List;

public interface CompanyPerformanceConstructionKindRepository {
    List<CompanyPerformanceConstructionKindResponse> findByPerformanceSeq(Long seq);
    CompanyPerformanceConstructionKindResponse findById(Long seq, Long id);
    Long create(Long seq, CompanyPerformanceConstructionKindRequest request);
    int update(Long seq, Long id, CompanyPerformanceConstructionKindRequest request);
    int delete(Long seq, Long id);
}
