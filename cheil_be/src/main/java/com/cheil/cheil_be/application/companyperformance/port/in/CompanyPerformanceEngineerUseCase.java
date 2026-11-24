package com.cheil.cheil_be.application.companyperformance.port.in;

import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceEngineerCommand;
import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceEngineerResult;
import com.cheil.cheil_be.application.engineer.EngineerCandidate;
import java.util.List;

public interface CompanyPerformanceEngineerUseCase {
    List<EngineerCandidate> findEngineerCandidates(String keyword, Integer limit);
    List<CompanyPerformanceEngineerResult> findByPerformanceSeq(Long seq);
    CompanyPerformanceEngineerResult create(Long seq, CompanyPerformanceEngineerCommand command);
    CompanyPerformanceEngineerResult update(Long seq, Long id, CompanyPerformanceEngineerCommand command);
    void delete(Long seq, Long id);
}
