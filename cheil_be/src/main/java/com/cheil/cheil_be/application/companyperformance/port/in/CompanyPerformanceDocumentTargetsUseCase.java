package com.cheil.cheil_be.application.companyperformance.port.in;

import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryCondition;
import com.cheil.cheil_be.application.companyperformance.model.CompanyPerformanceDocumentTargetDetails;
import java.util.List;

public interface CompanyPerformanceDocumentTargetsUseCase {
    List<CompanyPerformanceDocumentTargetDetails> findByBidSeq(Long bidSeq);
    List<CompanyPerformanceDocumentTargetDetails> add(Long bidSeq, List<Long> companyPerformanceSeqs);
    List<CompanyPerformanceDocumentTargetDetails> addByConditions(Long bidSeq, List<ProjectHistoryCondition> conditions);
    void replaceByConditions(Long bidSeq, List<ProjectHistoryCondition> conditions);
    void delete(Long bidSeq, Long targetId);
    void updateDisplayOrder(Long bidSeq, Long targetId, Integer displayOrder);
}
