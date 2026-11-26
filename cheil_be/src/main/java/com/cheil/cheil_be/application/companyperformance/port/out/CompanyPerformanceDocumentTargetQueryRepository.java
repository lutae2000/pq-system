package com.cheil.cheil_be.application.companyperformance.port.out;

import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryCondition;
import java.util.List;

public interface CompanyPerformanceDocumentTargetQueryRepository {

    List<Long> findMatchingPerformanceSeqs(List<ProjectHistoryCondition> conditions);
}
