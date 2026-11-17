package com.cheil.cheil_be.application.companyperformance.port.out;

import java.util.List;
import java.util.Optional;
import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceDocumentTarget;

public interface CompanyPerformanceDocumentTargetRepository {
    List<CompanyPerformanceDocumentTarget> findByBidSeq(Long bidSeq);
    Optional<CompanyPerformanceDocumentTarget> findById(Long targetId);
    void add(Long bidSeq, List<CompanyPerformanceDocumentTarget> targets);
    void delete(Long targetId);
    void updateDisplayOrder(Long targetId, Integer displayOrder);
}
