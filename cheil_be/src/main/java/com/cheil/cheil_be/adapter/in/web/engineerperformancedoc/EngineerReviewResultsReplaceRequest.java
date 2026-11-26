package com.cheil.cheil_be.adapter.in.web.engineerperformancedoc;

import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryCondition;
import java.util.List;

public record EngineerReviewResultsReplaceRequest(
        Long bidSeq,
        List<String> engineerIds,
        List<ProjectHistoryCondition> relatedProjectHistoryConditions
) {}
