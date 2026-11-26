package com.cheil.cheil_be.application.engineerperformancedoc.port.out;

import com.cheil.cheil_be.application.engineerperformancedoc.model.EngineerProjectHistoryReview;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryCondition;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionMetadata;
import java.util.List;
import java.util.Map;

public interface EngineerProjectHistoryRepository {
    List<EngineerProjectHistoryReview> findHistories(String engineerId, List<ProjectHistoryCondition> conditions,
            Map<String, ProjectHistoryConditionMetadata> metadata);

    void replaceReviewResults(Long bidSeq, List<String> engineerIds, String actor,
            List<ProjectHistoryCondition> conditions, Map<String, ProjectHistoryConditionMetadata> metadata, boolean selectAllWhenEmpty);
}
