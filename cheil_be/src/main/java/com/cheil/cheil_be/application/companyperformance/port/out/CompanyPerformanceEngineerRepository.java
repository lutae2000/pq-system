package com.cheil.cheil_be.application.companyperformance.port.out;

import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceEngineerCommand;
import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceEngineerResult;

import java.util.List;

public interface CompanyPerformanceEngineerRepository {
    List<CompanyPerformanceEngineerResult> findByPerformanceSeq(Long seq);
    CompanyPerformanceEngineerResult findById(Long seq, Long id);
    Long create(Long seq, CompanyPerformanceEngineerCommand command);
    int update(Long seq, Long id, CompanyPerformanceEngineerCommand command);
    int delete(Long seq, Long id);
    boolean contractPeriodBelongsToPerformance(Long seq, Long contractPeriodId);
}
