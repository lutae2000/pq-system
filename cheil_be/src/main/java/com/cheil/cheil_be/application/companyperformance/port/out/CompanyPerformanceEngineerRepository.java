package com.cheil.cheil_be.application.companyperformance.port.out;

import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceEngineerRequest;
import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceEngineerResponse;

import java.util.List;

public interface CompanyPerformanceEngineerRepository {
    List<CompanyPerformanceEngineerResponse> findByPerformanceSeq(Long seq);
    CompanyPerformanceEngineerResponse findById(Long seq, Long id);
    int create(Long seq, CompanyPerformanceEngineerRequest request);
    int update(Long seq, Long id, CompanyPerformanceEngineerRequest request);
    int delete(Long seq, Long id);
    Long findLatestId(Long seq, String engineerId);
}
