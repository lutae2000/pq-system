package com.cheil.cheil_be.application.pqparticipatingengineer.port.in;

import com.cheil.cheil_be.application.pqparticipatingengineer.model.CandidateEngineer;
import com.cheil.cheil_be.application.pqparticipatingengineer.model.CandidateEngineerFilters;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FindCandidateEngineersUseCase {
    Page<CandidateEngineer> findCandidates(CandidateEngineerFilters filters, String conditionsJson, Pageable pageable);
}
