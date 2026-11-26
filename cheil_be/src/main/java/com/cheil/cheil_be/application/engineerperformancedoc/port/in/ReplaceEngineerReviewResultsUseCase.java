package com.cheil.cheil_be.application.engineerperformancedoc.port.in;

import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryCondition;
import java.util.List;

public interface ReplaceEngineerReviewResultsUseCase {
    void replaceReviewResults(Long bidSeq, List<String> engineerIds, List<ProjectHistoryCondition> conditions);
}
