package com.cheil.cheil_be.application.companyperformance.port.out;

import java.util.List;
import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceDocumentTarget;

public interface CompanyPerformanceDocumentTargetRepository {
    List<CompanyPerformanceDocumentTarget> findByBidSeqAndEmployeeNo(Long bidSeq, String employeeNo);
    void save(Long bidSeq, String employeeNo, List<CompanyPerformanceDocumentTarget> targets);
}
