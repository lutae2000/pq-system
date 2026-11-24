package com.cheil.cheil_be.application.pqparticipatingengineer.port.out;

import com.cheil.cheil_be.application.pqparticipatingengineer.model.CandidateEngineer;
import com.cheil.cheil_be.application.pqparticipatingengineer.model.CandidateEngineerFilters;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryCondition;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionMetadata;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CandidateEngineerRepository {
    Page<CandidateEngineer> findCandidates(
            CandidateEngineerFilters filters,
            List<ProjectHistoryCondition> conditions,
            Map<String, ProjectHistoryConditionMetadata> metadata,
            Pageable pageable
    );
}
