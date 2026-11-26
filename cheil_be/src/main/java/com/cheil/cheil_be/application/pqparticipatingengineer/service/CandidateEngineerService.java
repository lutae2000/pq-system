package com.cheil.cheil_be.application.pqparticipatingengineer.service;

import com.cheil.cheil_be.application.pqparticipatingengineer.model.CandidateEngineer;
import com.cheil.cheil_be.application.pqparticipatingengineer.model.CandidateEngineerFilters;
import com.cheil.cheil_be.application.pqparticipatingengineer.port.in.FindCandidateEngineersUseCase;
import com.cheil.cheil_be.application.pqparticipatingengineer.port.out.CandidateEngineerRepository;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryCondition;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionJsonCodec;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionMetadata;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionMetadataService;
import com.cheil.cheil_be.application.relatedprojecthistory.condition.ProjectHistoryConditionValidation;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CandidateEngineerService implements FindCandidateEngineersUseCase {

    private final CandidateEngineerRepository repository;
    private final ProjectHistoryConditionJsonCodec conditionJsonCodec;
    private final ProjectHistoryConditionMetadataService conditionMetadataService;

    @Override
    @Transactional(readOnly = true)
    public Page<CandidateEngineer> findCandidates(CandidateEngineerFilters filters, String conditionsJson, Pageable pageable) {
        List<ProjectHistoryCondition> conditions = conditionJsonCodec.parse(conditionsJson);
        Map<String, ProjectHistoryConditionMetadata> metadata = conditions.isEmpty()
                ? Map.of() : conditionMetadataService.findAll();
        conditions.forEach(condition -> ProjectHistoryConditionValidation.validate(condition, metadata));
        return repository.findCandidates(filters, conditions, metadata, pageable);
    }
}
