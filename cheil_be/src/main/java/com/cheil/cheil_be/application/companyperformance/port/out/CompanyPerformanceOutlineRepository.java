package com.cheil.cheil_be.application.companyperformance.port.out;

import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceOutlineRequest;
import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceOutlineResponse;

import java.util.List;

public interface CompanyPerformanceOutlineRepository {
    List<CompanyPerformanceOutlineResponse> findByPerformanceSeq(Long seq);
    CompanyPerformanceOutlineResponse findById(Long seq, Long id);
    Long create(Long seq, CompanyPerformanceOutlineRequest request);
    int update(Long seq, Long id, CompanyPerformanceOutlineRequest request);
    int delete(Long seq, Long id);
}
